//! The inbound HTTP server: accepts connections, matches each request
//! against the precompiled route registry (`registry.rs`, kept in sync with
//! `Connected::flows()` by `main.rs`'s event loop — no per-request flow
//! collection cloning here), runs it, and waits for either a `respond` call
//! (see `functions.rs`) or the flow's own completion (if `respond` was
//! never called -> 204) before answering the client.

use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::{Arc, RwLock};
use std::time::Duration;

use hercules_sdk::Connected;
use http_body_util::{BodyExt, Full, Limited};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{
    Request, Response, StatusCode,
    body::{Bytes, Incoming},
};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use tokio::sync::oneshot;

use crate::admission::Admission;
use crate::limits::BodyLimits;
use crate::metrics::Metrics;
use crate::pending::{self, PendingResponses, RespondSignal};
use crate::registry::RouteRegistry;
use crate::{auth, content_type, input, response, validation};

/// Everything a connection/request handler needs, bundled so `serve`/
/// `handle` take one argument for "shared state" instead of one per piece —
/// cheap to clone (every field is an `Arc`/`Clone`-cheap handle).
#[derive(Clone)]
pub struct ServerState {
    pub connected: Connected,
    pub pending: PendingResponses,
    pub execution_timeout: Duration,
    pub registry: Arc<RwLock<Arc<RouteRegistry>>>,
    pub admission: Admission,
    pub limits: BodyLimits,
    pub metrics: Arc<Metrics>,
}

pub async fn serve(addr: SocketAddr, state: ServerState) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    log::info!("listening for webhook requests on {addr}");

    loop {
        let (stream, peer_addr) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let state = state.clone();

        tokio::spawn(async move {
            let svc = service_fn(move |req| {
                let state = state.clone();
                async move {
                    let response = handle(req, &state).await;
                    if let Ok(response) = &response {
                        state.metrics.record(response.status());
                    }
                    response
                }
            });

            if let Err(err) = http1::Builder::new().serve_connection(io, svc).await {
                log::debug!("connection from {peer_addr} closed with error: {err:?}");
            }
        });
    }
}

async fn handle(
    req: Request<Incoming>,
    state: &ServerState,
) -> Result<Response<Full<Bytes>>, Infallible> {
    let ServerState {
        connected,
        pending,
        execution_timeout,
        registry,
        admission,
        limits,
        ..
    } = state;
    let execution_timeout = *execution_timeout;
    let (parts, body) = req.into_parts();
    let method = parts.method;
    let path = parts.uri.path().to_string();
    let query = parts.uri.query().map(str::to_owned);
    let headers = parts.headers;

    log::debug!("{method} {path}: request received");

    if limits.exceeds_declared_length(&headers) {
        log::warn!("{method} {path}: request body exceeds the configured size limit");
        return Ok(response::error_to_http_response(
            StatusCode::PAYLOAD_TOO_LARGE,
            "Request body too large",
        ));
    }

    // Snapshot the current route table (an Arc pointer clone, not a flow
    // collection clone) and drop the lock immediately — matching happens
    // against this immutable snapshot with no lock held.
    let snapshot = Arc::clone(&*registry.read().unwrap_or_else(|err| err.into_inner()));
    let Some((route, captures)) = snapshot.find(&method, &path) else {
        log::debug!("{method} {path}: no flow matched");
        return Ok(response::error_to_http_response(
            StatusCode::NOT_FOUND,
            "No flow found for path",
        ));
    };
    let flow = Arc::clone(&route.flow);

    log::debug!("{method} {path}: matched flow {}", flow.flow_id);

    if let Err(err) = auth::validate_flow_auth(&flow, &headers) {
        log::warn!(
            "{method} {path}: flow {} rejected: {}",
            flow.flow_id,
            err.message()
        );
        let mut response = response::error_to_http_response(err.status_code(), err.message());
        response
            .headers_mut()
            .insert(auth::authenticate_header_name(), err.challenge());
        return Ok(response);
    }

    let path_params = route.path_params(&captures);
    drop(captures);

    // Admission control gates the CPU-expensive part of the request (body
    // parsing, schema validation, flow dispatch) — routing and auth above
    // are cheap and shouldn't be denied just because executions are
    // saturated.
    let Some(permit) = admission.try_acquire() else {
        log::warn!(
            "{method} {path}: flow {} rejected: execution admission saturated",
            flow.flow_id
        );
        let mut response = response::error_to_http_response(
            StatusCode::SERVICE_UNAVAILABLE,
            "Too many concurrent executions",
        );
        response.headers_mut().insert(
            hyper::header::RETRY_AFTER,
            hyper::header::HeaderValue::from(admission.retry_after_secs()),
        );
        return Ok(response);
    };

    // Admission is already held at this point, so a client that trickles
    // bytes in slowly (or stalls entirely) without exceeding the size limit
    // would otherwise occupy a permit indefinitely — bound the whole read by
    // a separate timeout, not just its size.
    let collect = BodyExt::collect(Limited::new(body, limits.max_bytes as usize));
    let body_bytes = match tokio::time::timeout(limits.read_timeout, collect).await {
        Err(_) => {
            log::warn!(
                "{method} {path}: request body was not fully received within {:?}",
                limits.read_timeout
            );
            return Ok(response::error_to_http_response(
                StatusCode::REQUEST_TIMEOUT,
                "Timed out reading request body",
            ));
        }
        Ok(Ok(collected)) => collected.to_bytes(),
        Ok(Err(err)) => {
            if err
                .downcast_ref::<http_body_util::LengthLimitError>()
                .is_some()
            {
                log::warn!("{method} {path}: request body exceeds the configured size limit");
                return Ok(response::error_to_http_response(
                    StatusCode::PAYLOAD_TOO_LARGE,
                    "Request body too large",
                ));
            }
            log::error!("{method} {path}: failed to read request body: {err}");
            return Ok(response::error_to_http_response(
                StatusCode::BAD_REQUEST,
                "Failed to read request body",
            ));
        }
    };

    let request_body_value = match content_type::parse_body_from_headers(&headers, &body_bytes) {
        Ok(value) => value,
        Err(err) => {
            log::warn!(
                "{method} {path}: flow {} failed to parse request body: {err}",
                flow.flow_id
            );
            let status = match err {
                content_type::BodyParseError::UnsupportedContentType { .. } => {
                    StatusCode::UNSUPPORTED_MEDIA_TYPE
                }
                _ => StatusCode::BAD_REQUEST,
            };
            return Ok(response::error_to_http_response(status, &err.to_string()));
        }
    };

    match route.validator() {
        Ok(validator) => {
            if let Err(err) =
                validation::validate_body_against_schema(validator, request_body_value.as_ref())
            {
                log::warn!(
                    "{method} {path}: flow {} failed input schema validation: {err}",
                    flow.flow_id
                );
                return Ok(response::error_to_http_response(
                    StatusCode::BAD_REQUEST,
                    &err.to_string(),
                ));
            }
        }
        Err(message) => {
            log::warn!(
                "{method} {path}: flow {} has an invalid input schema: {message}",
                flow.flow_id
            );
            return Ok(response::error_to_http_response(
                StatusCode::BAD_REQUEST,
                &format!("flow input schema is invalid: {message}"),
            ));
        }
    }

    let flow_input =
        input::build_flow_input(path_params, query.as_deref(), &headers, request_body_value);
    let payload = tucana::shared::helper::value::to_json_value(flow_input);

    Ok(execute_and_await_response(ExecutionRequest {
        connected: connected.clone(),
        pending: pending.clone(),
        flow_id: flow.flow_id,
        payload,
        route: format!("{method} {path}"),
        execution_timeout,
        permit,
        retry_after_secs: admission.retry_after_secs(),
    })
    .await)
}

/// Aborts the wrapped task when dropped, unless [`Self::disarm`] was called
/// first. Covers both explicit cancellation (HTTP timeout) and implicit
/// cancellation (client disconnects, which drops the future driving
/// `execute_and_await_response` mid-`.await`) with the same mechanism —
/// there's no separate code path for either, they both just stop polling
/// the future this guard lives in.
///
/// Best-effort only: aborting stops this process from waiting on Aquila for
/// a result, but it does not cancel an already-dispatched Taurus workflow —
/// there's no protocol for that yet. So the admission permit this task holds
/// (see `execute_and_await_response`) reflects *local* in-flight executions
/// this process is still tracking, not a hard guarantee on how many
/// workflows are actually running on the backend at once.
struct AbortOnDrop(Option<tokio::task::JoinHandle<()>>);

impl AbortOnDrop {
    /// The backend execution should keep running to completion in the
    /// background (a `respond` call doesn't mean the flow is done — it can
    /// keep executing after sending its response), so the task must not be
    /// aborted once this fires.
    fn disarm(mut self) {
        self.0.take();
    }
}

impl Drop for AbortOnDrop {
    fn drop(&mut self) {
        if let Some(handle) = self.0.take() {
            handle.abort();
        }
    }
}

/// Removes the HTTP-side pending-response entry when dropped, regardless of
/// which of `execute_and_await_response`'s exit paths ran — including the
/// implicit one (a client disconnect drops the future mid-`.await`,
/// bypassing every explicit branch below, and `AbortOnDrop` above only stops
/// the *execution* task, which — once aborted — never reaches its own
/// `pending::take` call). `pending::take` is idempotent (a no-op if `respond`
/// or the execution task already claimed the entry), so calling it here
/// unconditionally on every exit path is safe.
struct PendingGuard {
    pending: PendingResponses,
    execution_id: String,
}

impl Drop for PendingGuard {
    fn drop(&mut self) {
        pending::take(&self.pending, &self.execution_id);
    }
}

/// Bundles `execute_and_await_response`'s inputs — cuts its argument count
/// down to one and makes each call site self-documenting about which field
/// is which (`format!("{method} {path}")` at the call site was already
/// harder to read positionally than named).
struct ExecutionRequest {
    connected: Connected,
    pending: PendingResponses,
    flow_id: i64,
    payload: hercules_sdk::PlainValue,
    route: String,
    execution_timeout: Duration,
    permit: tokio::sync::OwnedSemaphorePermit,
    retry_after_secs: u64,
}

async fn execute_and_await_response(request: ExecutionRequest) -> Response<Full<Bytes>> {
    let ExecutionRequest {
        connected,
        pending,
        flow_id,
        payload,
        route,
        execution_timeout,
        permit,
        retry_after_secs,
    } = request;

    let execution_id = connected.reserve_execution_id();
    let (tx, rx) = oneshot::channel();
    pending::register(&pending, execution_id.clone(), tx);
    let _pending_guard = PendingGuard {
        pending: Arc::clone(&pending),
        execution_id: execution_id.clone(),
    };

    log::debug!("{route}: flow {flow_id} executing as {execution_id}");

    let execution = {
        let connected = connected.clone();
        let pending = Arc::clone(&pending);
        let execution_id = execution_id.clone();
        let handle = tokio::spawn(async move {
            // Held for the lifetime of this task rather than the HTTP wait
            // above it, so it represents a live backend workflow execution
            // — not just "an HTTP response is pending" — and is released
            // when the execution actually finishes (or this task is
            // aborted; see `AbortOnDrop`'s doc comment for the caveat that
            // implies).
            let _permit = permit;
            let result = connected
                .execute_flow_with_id(execution_id.clone(), flow_id.to_string(), payload)
                .await;
            // If `respond` was already called, it already claimed this
            // entry, so this only fires for the "flow finished without
            // ever calling respond" case.
            if let Some(tx) = pending::take(&pending, &execution_id) {
                let _ = tx.send(RespondSignal::FlowFinished(result));
            }
        });
        AbortOnDrop(Some(handle))
    };

    match tokio::time::timeout(execution_timeout, rx).await {
        Err(_) => {
            // `_pending_guard` and `execution` both drop at the end of this
            // function: the pending entry is removed, and the backend task
            // is aborted instead of left running past a deadline this
            // response already gave up on.
            log::warn!(
                "{route}: flow {flow_id} (execution {execution_id}) timed out after {execution_timeout:?} waiting for a result"
            );
            response::error_to_http_response(
                StatusCode::GATEWAY_TIMEOUT,
                "Flow execution timed out",
            )
        }
        Ok(Ok(RespondSignal::Respond(payload))) => {
            // The flow called `respond` but may still be running — let it
            // (and its admission permit) finish in the background rather
            // than aborting it out from under itself.
            execution.disarm();
            log::debug!(
                "{route}: flow {flow_id} (execution {execution_id}) responded with status {}",
                payload.status_code
            );
            response::respond_payload_to_http_response(payload)
        }
        Ok(Ok(RespondSignal::FlowFinished(Ok(_)))) => {
            log::debug!(
                "{route}: flow {flow_id} (execution {execution_id}) finished without calling respond, answering 204"
            );
            response::no_content_response()
        }
        Ok(Ok(RespondSignal::FlowFinished(Err(hercules_sdk::HerculesError::Overloaded {
            capacity,
        })))) => {
            log::warn!(
                "{route}: flow {flow_id} (execution {execution_id}) rejected: Aquila request queue is full (capacity {capacity})"
            );
            let mut response = response::error_to_http_response(
                StatusCode::SERVICE_UNAVAILABLE,
                "Too many concurrent executions",
            );
            response.headers_mut().insert(
                hyper::header::RETRY_AFTER,
                hyper::header::HeaderValue::from(retry_after_secs),
            );
            response
        }
        Ok(Ok(RespondSignal::FlowFinished(Err(err)))) => {
            log::error!("{route}: flow {flow_id} (execution {execution_id}) failed: {err}");
            response::error_to_http_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
            )
        }
        Ok(Err(_)) => {
            log::error!(
                "{route}: pending response for flow {flow_id} (execution {execution_id}) was dropped unexpectedly"
            );
            response::error_to_http_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
            )
        }
    }
}
