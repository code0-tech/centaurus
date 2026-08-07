//! `rest::control::respond`: the function a flow calls to send its HTTP
//! response. Dispatched to this action like any other remote function
//! (`taurus` routes it here because the flow definition's `definitionSource`
//! points at this action). `Respond::run` just hands the payload to whichever
//! `server.rs` HTTP handler is still waiting on `FunctionContext::execution_id`.

use std::collections::HashMap;

use hercules::{
    Arguments, FunctionContext, PlainValue, Result, RuntimeFunctionHandler, async_trait,
};

use crate::pending::{self, PendingResponses, RespondPayload, RespondSignal};

#[hercules::runtime_function(
    identifier = "rest::control::respond",
    signature = "<S extends HTTP_SCHEMA>(http_status_code: HTTP_STATUS_CODE, http_schema: S, payload: HTTP_PAYLOAD<S>, headers?: OBJECT<{}>): void",
    name(en_US = "Respond"),
    description(
        en_US = "Processes an HTTP response and returns it to the requesting client. This function typically completes the HTTP request–response cycle by delivering the server’s final output, such as headers, status codes, and body content, back to the client."
    ),
    display_message(
        en_US = "Sends response with status ${http_status_code} and payload ${payload}"
    ),
    alias(en_US = "respond;control;http"),
    display_icon = "tabler:cube-send",
    linked_data_type_identifiers("HTTP_STATUS_CODE", "OBJECT", "HTTP_SCHEMA", "HTTP_PAYLOAD"),
    manual
)]
#[parameter(
    runtime_name = "http_status_code",
    name(en_US = "HTTP Status Code"),
    description(
        en_US = "An HTTP status code is a three-digit number (100–599) indicating the result of a request (e.g., 200, 404, 500)."
    )
)]
#[parameter(
    runtime_name = "http_schema",
    name(en_US = "Content Type"),
    description(
        en_US = "Specifies the MIME type of the response payload, such as application/json, application/xml, or text/plain. This determines the expected format of the payload parameter."
    )
)]
#[parameter(
    runtime_name = "payload",
    name(en_US = "Response Payload"),
    description(
        en_US = "Contains the response payload. For application/json the value must be an OBJECT, for all other content types a plain string is expected."
    )
)]
#[parameter(
    runtime_name = "headers",
    name(en_US = "HTTP response headers"),
    description(
        en_US = "A collection of key-value pairs containing additional response metadata."
    ),
    optional
)]
pub struct Respond {
    pending: PendingResponses,
}

impl Respond {
    pub fn new(pending: PendingResponses) -> Self {
        Self { pending }
    }
}

#[async_trait]
impl RuntimeFunctionHandler for Respond {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let status_code: i64 = args.get("http_status_code")?;
        let content_type: String = args.get("http_schema")?;
        let payload: PlainValue = args.get("payload")?;
        let headers: HashMap<String, String> = args.get("headers").unwrap_or_default();

        log::info!(
            "respond called for execution {}: status {status_code}",
            context.execution_id
        );

        match pending::take(&self.pending, &context.execution_id) {
            Some(tx) => {
                let _ = tx.send(RespondSignal::Respond(RespondPayload {
                    status_code,
                    content_type,
                    payload,
                    headers,
                }));
            }
            // Not every execution of a flow that calls `respond` came from
            // an HTTP request waiting on a response. A manual/test
            // execution triggered outside `server.rs` has no such
            // connection to begin with, which is expected, not a failure.
            // (An HTTP request whose connection already timed out, or that
            // already got its response via an earlier `respond` call in the
            // same flow, lands here too and is equally harmless.)
            None => log::info!(
                "respond called for execution {} with no waiting HTTP connection",
                context.execution_id
            ),
        }

        Ok(PlainValue::Null)
    }
}
