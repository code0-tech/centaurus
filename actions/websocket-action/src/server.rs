//! The inbound WebSocket server: accepts TCP connections, performs the
//! WebSocket upgrade handshake (routing/auth against this action's
//! `WEBSOCKET_CONNECT`/`WEBSOCKET_MESSAGE` flows, matched via
//! `Connected::flows()` the same way rest-action's `server.rs` matches HTTP
//! requests), then for each open connection: fires `WEBSOCKET_CONNECT` once,
//! `WEBSOCKET_MESSAGE` per inbound frame, and finally `WEBSOCKET_DISCONNECT`
//! (with `WEBSOCKET_ERROR` firing first on a protocol error). Every fired
//! flow execution is fire-and-forget (no response is awaited), matching
//! cron-action's `execute_flow` style rather than rest-action's
//! request/response correlation — a WebSocket frame isn't a request. A flow
//! that wants to talk back calls the `send` runtime function
//! (`functions.rs`), which looks up this connection's outbound channel in
//! `outbound.rs` by the triggering execution's id.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Mutex;

use futures_util::{SinkExt, StreamExt};
use hercules::{Connected, PlainValue};
use http::{HeaderMap, HeaderValue, Response, StatusCode};
use serde_json::json;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::handshake::server::{ErrorResponse, Request};
use tokio_tungstenite::tungstenite::protocol::CloseFrame;
use tokio_tungstenite::tungstenite::Message;

use crate::outbound::{self, OutboundConnections, OutboundSender};
use crate::{auth, route};

pub async fn serve(
    addr: SocketAddr,
    connected: Connected,
    outbound: OutboundConnections,
) -> std::io::Result<()> {
    let listener = TcpListener::bind(addr).await?;
    log::info!("listening for websocket connections on {addr}");

    loop {
        let (stream, peer_addr) = listener.accept().await?;
        let connected = connected.clone();
        let outbound = outbound.clone();

        tokio::spawn(async move {
            if let Err(err) = handle_connection(stream, connected, outbound).await {
                log::debug!("connection from {peer_addr} closed with error: {err}");
            }
        });
    }
}

/// What the (synchronous) handshake callback captured about the accepted
/// request, for use once we're back in async code.
#[derive(Default, Clone)]
struct HandshakeInfo {
    path: String,
    headers: HeaderMap<HeaderValue>,
    query_params: HashMap<String, String>,
}

async fn handle_connection(
    stream: TcpStream,
    connected: Connected,
    outbound: OutboundConnections,
) -> Result<(), String> {
    let captured: Mutex<Option<HandshakeInfo>> = Mutex::new(None);
    let connected_for_handshake = connected.clone();

    let callback = |req: &Request, response: Response<()>| {
        let path = req.uri().path().to_string();
        let query_params = parse_query(req.uri().query());
        let headers = req.headers().clone();

        let flows = connected_for_handshake.flows();
        if !route::any_flow_matches_path(&flows, &path) {
            log::info!("websocket handshake on {path}: no flow matched");
            return Err(reject(StatusCode::NOT_FOUND, "No flow found for path"));
        }

        // Fail closed: if any WEBSOCKET_CONNECT flow bound to this path
        // requires auth, the whole handshake needs valid credentials — there
        // is no way to accept the TCP connection but selectively withhold it
        // from just the flows that wanted auth.
        for flow in route::find_matching_connect_flows(&flows, &path) {
            if let Err(err) = auth::validate_flow_auth(&flow, &headers, &query_params) {
                log::warn!(
                    "websocket handshake on {path}: flow {} rejected: {}",
                    flow.flow_id,
                    err.message()
                );
                return Err(reject(StatusCode::UNAUTHORIZED, err.message()));
            }
        }

        *captured.lock().unwrap_or_else(|err| err.into_inner()) = Some(HandshakeInfo {
            path,
            headers,
            query_params,
        });

        Ok(response)
    };

    let ws_stream = tokio_tungstenite::accept_hdr_async(stream, callback)
        .await
        .map_err(|err| format!("handshake failed: {err}"))?;

    let HandshakeInfo {
        path,
        headers,
        query_params,
    } = captured
        .into_inner()
        .unwrap_or_else(|err| err.into_inner())
        .ok_or_else(|| "handshake accepted without capturing request info".to_string())?;

    let connection_id = uuid::Uuid::new_v4().to_string();
    log::info!("{connection_id}: websocket connected on {path}");

    let (write, mut read) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    tokio::spawn(async move {
        let mut write = write;
        while let Some(message) = rx.recv().await {
            if let Err(err) = write.send(message).await {
                log::debug!("failed to write websocket frame: {err}");
                break;
            }
        }
    });

    for flow in route::find_matching_connect_flows(&connected.flows(), &path) {
        let path_params = route::extract_path_params(&flow, route::CONNECT_PATH_SETTING, &path);
        let payload = json!({
            "connection_id": connection_id,
            "path": path,
            "headers": header_map_to_json(&headers),
            "query_params": query_params,
            "path_params": path_params,
        });
        fire(&connected, &outbound, &tx, flow.flow_id, payload);
    }

    let (was_clean, code, reason) = loop {
        match read.next().await {
            Some(Ok(Message::Text(text))) => {
                let payload = parse_text_payload(text.as_str());
                dispatch_message(&connected, &outbound, &tx, &connection_id, &path, false, payload);
            }
            Some(Ok(Message::Binary(bytes))) => {
                use base64::Engine;
                let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
                dispatch_message(
                    &connected,
                    &outbound,
                    &tx,
                    &connection_id,
                    &path,
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
                log::warn!("{connection_id}: websocket protocol error: {err}");
                dispatch_error(&connected, &outbound, &tx, &connection_id, &path, err.to_string());
                break (false, None, Some(err.to_string()));
            }
            None => {
                break (false, None, None);
            }
        }
    };

    log::info!("{connection_id}: websocket disconnected on {path} (clean={was_clean})");
    for flow in route::find_matching_disconnect_flows(&connected.flows(), &path) {
        let path_params = route::extract_path_params(&flow, route::DISCONNECT_PATH_SETTING, &path);
        let payload = json!({
            "connection_id": connection_id,
            "path": path,
            "code": code,
            "reason": reason,
            "was_clean": was_clean,
            "path_params": path_params,
        });
        fire(&connected, &outbound, &tx, flow.flow_id, payload);
    }

    Ok(())
}

fn dispatch_message(
    connected: &Connected,
    outbound: &OutboundConnections,
    tx: &OutboundSender,
    connection_id: &str,
    path: &str,
    is_binary: bool,
    payload: serde_json::Value,
) {
    for flow in route::find_matching_message_flows(&connected.flows(), path) {
        let path_params = route::extract_path_params(&flow, route::MESSAGE_PATH_SETTING, path);
        let flow_payload = json!({
            "connection_id": connection_id,
            "path": path,
            "is_binary": is_binary,
            "payload": payload,
            "path_params": path_params,
        });
        fire(connected, outbound, tx, flow.flow_id, flow_payload);
    }
}

fn dispatch_error(
    connected: &Connected,
    outbound: &OutboundConnections,
    tx: &OutboundSender,
    connection_id: &str,
    path: &str,
    message: String,
) {
    for flow in route::find_matching_error_flows(&connected.flows(), path) {
        let path_params = route::extract_path_params(&flow, route::ERROR_PATH_SETTING, path);
        let payload = json!({
            "connection_id": connection_id,
            "path": path,
            "message": message,
            "path_params": path_params,
        });
        fire(connected, outbound, tx, flow.flow_id, payload);
    }
}

/// Executes `flow_id` fire-and-forget (cron-action's `execute_flow` style —
/// no reply is awaited), first registering `tx` as this execution's outbound
/// channel so a `send` call from within the flow (functions.rs) can find its
/// way back to this connection. The registration is removed once the
/// execution finishes so `outbound`'s map doesn't grow unbounded.
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

fn parse_query(query: Option<&str>) -> HashMap<String, String> {
    let Some(query) = query else {
        return HashMap::new();
    };
    form_urlencoded::parse(query.as_bytes())
        .map(|(key, value)| (key.into_owned(), value.into_owned()))
        .collect()
}

fn header_map_to_json(headers: &HeaderMap<HeaderValue>) -> HashMap<String, String> {
    headers
        .iter()
        .map(|(name, value)| {
            let value = value
                .to_str()
                .map(str::to_owned)
                .unwrap_or_else(|_| String::from_utf8_lossy(value.as_bytes()).into_owned());
            (name.as_str().to_owned(), value)
        })
        .collect()
}

fn reject(status: StatusCode, message: &str) -> ErrorResponse {
    Response::builder()
        .status(status)
        .body(Some(message.to_string()))
        .unwrap_or_else(|_| {
            let mut response = Response::new(Some(message.to_string()));
            *response.status_mut() = status;
            response
        })
}
