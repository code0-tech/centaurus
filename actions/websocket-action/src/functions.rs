//! `websocket::control::send`: the function a flow calls to push a frame
//! back out on the connection its trigger fired for. Dispatched to this
//! action like any other remote function; `Send::run` just enqueues onto
//! whichever `server.rs` connection is still registered for
//! `FunctionContext::execution_id`. Analogous to rest-action's
//! `functions.rs::Respond`, but fire-and-forget (no reply to correlate) and
//! reusable any number of times for as long as the triggering flow execution
//! is still running.

use hercules::{Arguments, FunctionContext, PlainValue, Result, RuntimeFunctionHandler, async_trait};
use tokio_tungstenite::tungstenite::Message;

use crate::outbound::{self, OutboundConnections};

#[hercules::runtime_function(
    identifier = "websocket::control::send",
    signature = "(payload: TEXT, is_binary?: BOOLEAN): void",
    name(en_US = "Send"),
    description(
        en_US = "Sends a WebSocket frame back out on the connection that triggered this flow execution (a 'WebSocket Connected' or 'WebSocket Message Received' event). Text is sent as a text frame by default; set is_binary to send the payload (base64-decoded) as a binary frame instead."
    ),
    display_message(en_US = "Sends WebSocket message ${payload}"),
    alias(en_US = "send;control;websocket;ws"),
    display_icon = "tabler:cube-send",
    linked_data_type_identifiers("TEXT", "BOOLEAN"),
    manual
)]
#[parameter(
    runtime_name = "payload",
    name(en_US = "Payload"),
    description(
        en_US = "The message to send. For a text frame this is sent as-is; for a binary frame (is_binary = true) this is expected to be base64-encoded."
    )
)]
#[parameter(
    runtime_name = "is_binary",
    name(en_US = "Send as binary"),
    description(en_US = "If true, the payload is base64-decoded and sent as a binary frame instead of a text frame."),
    optional
)]
pub struct Send {
    connections: OutboundConnections,
}

impl Send {
    pub fn new(connections: OutboundConnections) -> Self {
        Self { connections }
    }
}

#[async_trait]
impl RuntimeFunctionHandler for Send {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let payload: String = args.get("payload")?;
        let is_binary: bool = args.get("is_binary").unwrap_or(false);

        let message = if is_binary {
            use base64::Engine;
            let bytes = base64::engine::general_purpose::STANDARD
                .decode(payload.as_bytes())
                .map_err(|err| {
                    hercules::HerculesError::runtime(
                        "INVALID_BASE64_PAYLOAD",
                        Some(err.to_string()),
                    )
                })?;
            Message::Binary(bytes.into())
        } else {
            Message::Text(payload.into())
        };

        match outbound::get(&self.connections, &context.execution_id) {
            Some(sender) => {
                if sender.send(message).is_err() {
                    log::info!(
                        "send called for execution {} but the connection already closed",
                        context.execution_id
                    );
                }
            }
            // Not every execution of a flow that calls `send` came from an
            // inbound connection event still open (a manual/test execution,
            // or a connection that already closed). That's expected, not a
            // failure — same reasoning as rest-action's `Respond`.
            None => log::info!(
                "send called for execution {} with no registered connection",
                context.execution_id
            ),
        }

        Ok(PlainValue::Null)
    }
}
