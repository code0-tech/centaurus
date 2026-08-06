//! The inbound HTTP server: accepts connections, matches each request to
//! one of this action's flows via `Connected::flows()` (replacing draco's
//! NATS-KV-backed `AdapterStore`), runs it, and waits for either a
//! `respond` call (see `functions.rs`) or the flow's own completion (if
//! `respond` was never called -> 204) before answering the client.

use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;

use hercules::Connected;
use http_body_util::{BodyExt, Full};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{
    Request, Response, StatusCode,
    body::{Bytes, Incoming},
};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use tokio::sync::oneshot;

use crate::pending::{self, PendingResponses, RespondSignal};
use crate::{auth, content_type, flow_setting, input, response, route, validation};

pub async fn serve(
    addr: SocketAddr,
    connected: Connected,
    pending: PendingResponses,
) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    log::info!("listening for webhook requests on {addr}");

    loop {
        let (stream, peer_addr) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let connected = connected.clone();
        let pending = Arc::clone(&pending);

        tokio::spawn(async move {
            let svc = service_fn(move |req| handle(req, connected.clone(), Arc::clone(&pending)));

            if let Err(err) = http1::Builder::new().serve_connection(io, svc).await {
                log::debug!("connection from {peer_addr} closed with error: {err:?}");
            }
        });
    }
}

async fn handle(
    req: Request<Incoming>,
    connected: Connected,
    pending: PendingResponses,
) -> Result<Response<Full<Bytes>>, Infallible> {
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let query = req.uri().query().map(str::to_owned);
    let headers = req.headers().clone();

    let body_bytes = match BodyExt::collect(req.into_body()).await {
        Ok(collected) => collected.to_bytes().to_vec(),
        Err(err) => {
            log::error!("failed to read request body: {err}");
            return Ok(response::error_to_http_response(
                StatusCode::BAD_REQUEST,
                "Failed to read request body",
            ));
        }
    };

    let flows = connected.flows();
    let Some(flow) = route::find_matching_flow(&flows, &method, &path) else {
        return Ok(response::error_to_http_response(
            StatusCode::NOT_FOUND,
            "No flow found for path",
        ));
    };

    if let Err(err) = auth::validate_flow_auth(&flow, &headers) {
        let mut response = response::error_to_http_response(err.status_code(), err.message());
        response
            .headers_mut()
            .insert(auth::authenticate_header_name(), err.challenge());
        return Ok(response);
    }

    let request_body_value = match content_type::parse_body_from_headers(&headers, &body_bytes) {
        Ok(value) => value,
        Err(err) => {
            log::warn!("failed to parse request body: {err}");
            let status = match err {
                content_type::BodyParseError::UnsupportedContentType { .. } => {
                    StatusCode::UNSUPPORTED_MEDIA_TYPE
                }
                _ => StatusCode::BAD_REQUEST,
            };
            return Ok(response::error_to_http_response(status, &err.to_string()));
        }
    };

    let input_schema = flow_setting::as_struct(&flow, "input_schema");
    if let Err(err) =
        validation::validate_body_against_schema(input_schema, request_body_value.as_ref())
    {
        log::warn!(
            "request body failed input schema validation: flow_id={} error={err}",
            flow.flow_id
        );
        return Ok(response::error_to_http_response(
            StatusCode::BAD_REQUEST,
            &err.to_string(),
        ));
    }

    let flow_input =
        input::build_flow_input(&flow, &path, query.as_deref(), &headers, request_body_value);
    let payload = tucana::shared::helper::value::to_json_value(flow_input);

    Ok(execute_and_await_response(connected, pending, flow.flow_id, payload).await)
}

async fn execute_and_await_response(
    connected: Connected,
    pending: PendingResponses,
    flow_id: i64,
    payload: hercules::PlainValue,
) -> Response<Full<Bytes>> {
    let execution_id = connected.reserve_execution_id();
    let (tx, rx) = oneshot::channel();
    pending::register(&pending, execution_id.clone(), tx);

    {
        let connected = connected.clone();
        let pending = Arc::clone(&pending);
        let execution_id = execution_id.clone();
        tokio::spawn(async move {
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
    }

    match rx.await {
        Ok(RespondSignal::Respond(payload)) => response::respond_payload_to_http_response(payload),
        Ok(RespondSignal::FlowFinished(Ok(_))) => response::no_content_response(),
        Ok(RespondSignal::FlowFinished(Err(err))) => {
            log::error!("flow {flow_id} (execution {execution_id}) failed: {err}");
            response::error_to_http_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
            )
        }
        Err(_) => {
            log::error!("pending response for execution {execution_id} was dropped unexpectedly");
            response::error_to_http_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
            )
        }
    }
}
