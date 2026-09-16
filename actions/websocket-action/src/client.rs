//! Outbound WebSocket client connections: the mirror of `server.rs` for
//! *this action* connecting *out* to another WebSocket server, one
//! long-lived connection per flow that carries a `WEBSOCKET_CLIENT_CONNECT`
//! trigger.
//!
//! Unlike the inbound server side, there's no listener to bind once and
//! route arbitrary connections through — each client connection belongs to
//! exactly one flow (the one whose `ws_client_connect_url` setting names the
//! target), so the connection's lifecycle is driven by that flow's own
//! lifecycle: `main.rs` calls [`ClientManager::reconcile`] on every
//! `HerculesEvent::FlowUpserted` (starting a connection task the first time
//! a flow gets client-connect settings, restarting it if those settings
//! change) and [`ClientManager::remove`] on `HerculesEvent::FlowDeleted`.
//!
//! Once connected, frames are dispatched the same way `server.rs` does
//! (`WEBSOCKET_CLIENT_MESSAGE` per frame, fire-and-forget
//! `execute_flow_with_id`, the triggering execution's outbound channel
//! registered in `outbound.rs` so `functions.rs`'s `send` works unmodified).
//! What's genuinely new here: a client losing its connection should retry
//! rather than just exit, so the per-flow task loops forever, reconnecting
//! with exponential backoff after every disconnect (clean or not) or failed
//! connection attempt.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use hercules::{Connected, PlainValue};
use serde_json::json;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::protocol::CloseFrame;
use tucana::aquila::ActionFlow;

use crate::flow_setting;
use crate::outbound::{self, OutboundConnections, OutboundSender};
use crate::{auth, route};

/// Backoff applied between reconnect attempts for a single flow's
/// connection: doubles after every failed attempt or dropped connection, up
/// to `RECONNECT_MAX`, and resets to `RECONNECT_INITIAL` after every
/// successful connect (regardless of how long it then stays up).
const RECONNECT_INITIAL: Duration = Duration::from_secs(1);
const RECONNECT_MAX: Duration = Duration::from_secs(30);

/// Tracks the one outbound-connection task spawned per flow carrying a
/// `WEBSOCKET_CLIENT_CONNECT` trigger, keyed by `flow_id`, so `main.rs` can
/// start/stop them as flows are upserted/deleted.
pub struct ClientManager {
    tasks: Mutex<HashMap<i64, JoinHandle<()>>>,
}

impl ClientManager {
    pub fn new() -> Self {
        Self {
            tasks: Mutex::new(HashMap::new()),
        }
    }

    /// Re-evaluates whether `flow` should have a running outbound connection
    /// task. `flow` may belong to any of the four `WEBSOCKET_CLIENT_*`
    /// events (or none of them) — this only acts when it carries
    /// `ws_client_connect_url` (i.e. it's a `WEBSOCKET_CLIENT_CONNECT` flow).
    ///
    /// Always stops any previously-running task for this `flow_id` first:
    /// `HerculesEvent::FlowUpserted` only fires for a genuine change (see
    /// `hercules::Connected`'s doc), so if this flow already had a task
    /// running its settings (the target URL, or auth) may well have changed
    /// and the connection needs to be re-established against the new
    /// configuration.
    pub fn reconcile(&self, flow: &ActionFlow, connected: &Connected, outbound: &OutboundConnections) {
        self.stop(flow.flow_id);

        let Some(url) = flow_setting::as_string(flow, route::CLIENT_CONNECT_URL_SETTING) else {
            return;
        };
        let url = url.to_string();

        log::info!(
            "flow {} carries a client-connect target ({url}); starting outbound connection",
            flow.flow_id
        );

        let flow = flow.clone();
        let connected = connected.clone();
        let outbound = outbound.clone();
        let flow_id = flow.flow_id;
        let handle = tokio::spawn(async move {
            run_connection(flow, url, connected, outbound).await;
        });

        self.tasks().insert(flow_id, handle);
    }

    /// Stops (aborts) `flow_id`'s connection task, if one is running. Call
    /// on `HerculesEvent::FlowDeleted`.
    pub fn remove(&self, flow_id: i64) {
        self.stop(flow_id);
    }

    fn stop(&self, flow_id: i64) {
        if let Some(handle) = self.tasks().remove(&flow_id) {
            handle.abort();
        }
    }

    fn tasks(&self) -> std::sync::MutexGuard<'_, HashMap<i64, JoinHandle<()>>> {
        self.tasks.lock().unwrap_or_else(|err| err.into_inner())
    }
}

impl Default for ClientManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Runs forever: connects to `url`, serves it until it disconnects (cleanly
/// or not), then reconnects with backoff. Only returns if the task is
/// aborted (`ClientManager::stop`/`Drop` of the `JoinHandle`).
async fn run_connection(flow: ActionFlow, url: String, connected: Connected, outbound: OutboundConnections) {
    let mut backoff = RECONNECT_INITIAL;

    loop {
        match connect_once(&flow, &url, &connected, &outbound).await {
            Ok(()) => {
                // Connected, ran, and eventually disconnected — reset the
                // backoff since the target was reachable.
                backoff = RECONNECT_INITIAL;
            }
            Err(err) => {
                log::warn!(
                    "flow {}: outbound websocket connection to {url} failed: {err}",
                    flow.flow_id
                );
            }
        }

        log::info!(
            "flow {}: reconnecting to {url} in {backoff:?}",
            flow.flow_id
        );
        tokio::time::sleep(backoff).await;
        backoff = (backoff * 2).min(RECONNECT_MAX);
    }
}

/// One connection attempt end-to-end: connect, fire `WEBSOCKET_CLIENT_CONNECT`,
/// serve frames until disconnect, fire `WEBSOCKET_CLIENT_DISCONNECT`.
///
/// Returns `Err` only if the connection attempt itself failed (in which case
/// a `WEBSOCKET_CLIENT_ERROR` — not `_DISCONNECT`, since there was never a
/// connection to disconnect from — is fired first); `Ok(())` covers every
/// other outcome, including a protocol error mid-connection (which still
/// gets a `WEBSOCKET_CLIENT_DISCONNECT` once the read loop gives up).
async fn connect_once(
    flow: &ActionFlow,
    url: &str,
    connected: &Connected,
    outbound: &OutboundConnections,
) -> Result<(), String> {
    // Reserved before the connection attempt so a failed attempt still has a
    // stable id to report in its WEBSOCKET_CLIENT_ERROR payload.
    let connection_id = uuid::Uuid::new_v4().to_string();

    let mut request = url
        .into_client_request()
        .map_err(|err| format!("invalid target url: {err}"))?;
    if let Some(header_value) = auth::client_authorization_header(flow) {
        let header_value = header_value
            .parse()
            .map_err(|err| format!("invalid authorization header value: {err}"))?;
        request
            .headers_mut()
            .insert(http::header::AUTHORIZATION, header_value);
    }

    let ws_stream = match tokio_tungstenite::connect_async(request).await {
        Ok((stream, _response)) => stream,
        Err(err) => {
            let (tx, _rx) = mpsc::unbounded_channel::<Message>();
            dispatch_error(
                connected,
                outbound,
                &tx,
                &connection_id,
                &flow.project_slug,
                url,
                format!("connection failed: {err}"),
            );
            return Err(err.to_string());
        }
    };

    log::info!(
        "{connection_id}: outbound websocket connected to {url} (flow {})",
        flow.flow_id
    );

    let (write, mut read) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    tokio::spawn(async move {
        let mut write = write;
        while let Some(message) = rx.recv().await {
            if let Err(err) = write.send(message).await {
                log::debug!("failed to write outbound websocket frame: {err}");
                break;
            }
        }
    });

    for target in route::find_matching_client_connect_flows(&connected.flows(), &flow.project_slug, url) {
        let payload = json!({
            "connection_id": connection_id,
            "url": url,
        });
        fire(connected, outbound, &tx, target.flow_id, payload);
    }

    let (was_clean, code, reason) = loop {
        match read.next().await {
            Some(Ok(Message::Text(text))) => {
                let payload = parse_text_payload(text.as_str());
                dispatch_message(
                    connected,
                    outbound,
                    &tx,
                    &connection_id,
                    &flow.project_slug,
                    url,
                    false,
                    payload,
                );
            }
            Some(Ok(Message::Binary(bytes))) => {
                use base64::Engine;
                let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
                dispatch_message(
                    connected,
                    outbound,
                    &tx,
                    &connection_id,
                    &flow.project_slug,
                    url,
                    true,
                    serde_json::Value::String(encoded),
                );
            }
            Some(Ok(Message::Ping(payload))) => {
                let _ = tx.send(Message::Pong(payload));
            }
            Some(Ok(Message::Pong(_))) => {}
            Some(Ok(Message::Close(frame))) => {
                break close_details(frame, true);
            }
            Some(Ok(Message::Frame(_))) => {}
            Some(Err(err)) => {
                log::warn!("{connection_id}: outbound websocket protocol error: {err}");
                dispatch_error(
                    connected,
                    outbound,
                    &tx,
                    &connection_id,
                    &flow.project_slug,
                    url,
                    err.to_string(),
                );
                break (false, None, Some(err.to_string()));
            }
            None => {
                break (false, None, None);
            }
        }
    };

    log::info!(
        "{connection_id}: outbound websocket disconnected from {url} (clean={was_clean})"
    );
    for target in route::find_matching_client_disconnect_flows(&connected.flows(), &flow.project_slug, url) {
        let payload = json!({
            "connection_id": connection_id,
            "url": url,
            "code": code,
            "reason": reason,
            "was_clean": was_clean,
        });
        fire(connected, outbound, &tx, target.flow_id, payload);
    }

    Ok(())
}

fn dispatch_message(
    connected: &Connected,
    outbound: &OutboundConnections,
    tx: &OutboundSender,
    connection_id: &str,
    project_slug: &str,
    url: &str,
    is_binary: bool,
    payload: serde_json::Value,
) {
    for target in route::find_matching_client_message_flows(&connected.flows(), project_slug, url) {
        let flow_payload = json!({
            "connection_id": connection_id,
            "url": url,
            "is_binary": is_binary,
            "payload": payload,
        });
        fire(connected, outbound, tx, target.flow_id, flow_payload);
    }
}

fn dispatch_error(
    connected: &Connected,
    outbound: &OutboundConnections,
    tx: &OutboundSender,
    connection_id: &str,
    project_slug: &str,
    url: &str,
    message: String,
) {
    for target in route::find_matching_client_error_flows(&connected.flows(), project_slug, url) {
        let payload = json!({
            "connection_id": connection_id,
            "url": url,
            "message": message,
        });
        fire(connected, outbound, tx, target.flow_id, payload);
    }
}

/// Executes `flow_id` fire-and-forget (cron-action's `execute_flow` style —
/// no reply is awaited), first registering `tx` as this execution's outbound
/// channel in the same `outbound.rs` registry `server.rs` uses, so a `send`
/// call from within the flow (functions.rs) works identically for a client
/// connection with no changes needed there. The registration is removed once
/// the execution finishes so `outbound`'s map doesn't grow unbounded.
fn fire(
    connected: &Connected,
    outbound: &OutboundConnections,
    tx: &OutboundSender,
    flow_id: i64,
    payload: PlainValue,
) {
    let execution_id = connected.reserve_execution_id();
    outbound::register(outbound, execution_id.clone(), tx.clone());

    let connected = connected.clone();
    let outbound = outbound.clone();
    tokio::spawn(async move {
        let result = connected
            .execute_flow_with_id(execution_id.clone(), flow_id.to_string(), payload)
            .await;
        outbound::remove(&outbound, &execution_id);
        if let Err(err) = result {
            log::error!("flow {flow_id} (execution {execution_id}) failed: {err}");
        }
    });
}

fn close_details(frame: Option<CloseFrame>, was_clean: bool) -> (bool, Option<u16>, Option<String>) {
    match frame {
        Some(frame) => (
            was_clean,
            Some(frame.code.into()),
            Some(frame.reason.to_string()),
        ),
        None => (was_clean, None, None),
    }
}

fn parse_text_payload(text: &str) -> serde_json::Value {
    serde_json::from_str(text).unwrap_or_else(|_| serde_json::Value::String(text.to_string()))
}
