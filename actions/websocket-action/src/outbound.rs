//! Correlates a `send` function call (identified by
//! `FunctionContext::execution_id`) back to the WebSocket connection whose
//! flow execution it belongs to. Mirrors rest-action's `pending.rs`, but
//! simplified: there's no request/response correlation to do here (a
//! WebSocket message isn't a request), so instead of a one-shot channel that
//! gets taken exactly once, this just hands out clones of a per-connection
//! `mpsc` sender that `send` can push onto any number of times for as long
//! as the triggering flow execution is registered.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

pub type OutboundSender = mpsc::UnboundedSender<Message>;
pub type OutboundConnections = Arc<Mutex<HashMap<String, OutboundSender>>>;

pub fn new_outbound_connections() -> OutboundConnections {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Registers `sender` as the outbound channel for `execution_id`, to be
/// looked up by [`get`] for the lifetime of that flow execution. Call
/// [`remove`] once the execution finishes so the map doesn't grow unbounded.
pub fn register(connections: &OutboundConnections, execution_id: String, sender: OutboundSender) {
    lock(connections).insert(execution_id, sender);
}

/// Looks up (without removing) the outbound sender for `execution_id`, if
/// its flow execution is still registered.
pub fn get(connections: &OutboundConnections, execution_id: &str) -> Option<OutboundSender> {
    lock(connections).get(execution_id).cloned()
}

pub fn remove(connections: &OutboundConnections, execution_id: &str) {
    lock(connections).remove(execution_id);
}

fn lock(connections: &OutboundConnections) -> std::sync::MutexGuard<'_, HashMap<String, OutboundSender>> {
    connections.lock().unwrap_or_else(|err| err.into_inner())
}
