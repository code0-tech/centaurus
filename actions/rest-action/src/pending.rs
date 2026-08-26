//! Correlates a `respond` function call (identified by
//! `FunctionContext::execution_id`) back to the HTTP connection that's
//! still waiting on it. See `functions.rs` (the sender side) and
//! `server.rs` (the receiver side, plus the "flow finished with no respond
//! call" -> 204 fallback).

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use hercules_sdk::{PlainValue, Result};
use tokio::sync::oneshot;

pub struct RespondPayload {
    pub status_code: i64,
    pub content_type: String,
    pub payload: PlainValue,
    pub headers: HashMap<String, String>,
}

pub enum RespondSignal {
    Respond(RespondPayload),
    FlowFinished(Result<PlainValue>),
}

pub type PendingResponses = Arc<Mutex<HashMap<String, oneshot::Sender<RespondSignal>>>>;

pub fn new_pending_responses() -> PendingResponses {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Registers a waiter for `execution_id`, to be fulfilled by [`take`].
pub fn register(
    pending: &PendingResponses,
    execution_id: String,
    tx: oneshot::Sender<RespondSignal>,
) {
    lock(pending).insert(execution_id, tx);
}

/// Removes and returns the waiter for `execution_id`, if one is still
/// registered. `None` means someone else (a `respond` call, or the flow
/// finishing) already claimed it first.
pub fn take(
    pending: &PendingResponses,
    execution_id: &str,
) -> Option<oneshot::Sender<RespondSignal>> {
    lock(pending).remove(execution_id)
}

fn lock(
    pending: &PendingResponses,
) -> std::sync::MutexGuard<'_, HashMap<String, oneshot::Sender<RespondSignal>>> {
    pending.lock().unwrap_or_else(|err| err.into_inner())
}
