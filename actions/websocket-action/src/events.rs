//! The four `WebSocket` flow triggers.
//!
//! Registering these `RuntimeEvent`s is what lets users attach a flow to a
//! WebSocket endpoint in the platform UI; Aquila then pushes each such flow
//! down to this action as an `ActionFlow` with its own event's settings
//! filled in. `server.rs` matches incoming connections/messages against
//! those settings.
//!
//! Unlike `rest-action` (a single `REST` trigger), a WebSocket connection has
//! several distinct moments a flow can react to, so there are four separate
//! events here instead of one. `ActionFlow` (as pushed down by Aquila) does
//! not currently carry which runtime event a flow was defined against, so
//! each event below uses its own uniquely-named path setting
//! (`ws_connect_path` / `ws_message_path` / `ws_disconnect_path` /
//! `ws_error_path`) rather than sharing a single `ws_path` identifier — that
//! is what lets `route.rs` tell, from `flow.settings` alone, which of the
//! four events a given flow belongs to. See a note on this in the
//! `websocket-action` README/PR description.

#[hercules::runtime_event(
    identifier = "WEBSOCKET_CONNECT",
    signature = "<A extends WEBSOCKET_AUTH_TYPE>(ws_connect_path: HTTP_URL, ws_auth: A, ws_auth_value: WEBSOCKET_AUTH_VALUE<A>): WEBSOCKET_CONNECT_INPUT",
    name(en_US = "WebSocket Connected"),
    description(
        en_US = "Fires once when a client completes the WebSocket handshake on the configured path, giving the flow a chance to run connection setup logic (e.g. sending a welcome message via 'send')."
    ),
    display_message(en_US = "WebSocket client connected on ${ws_connect_path}"),
    alias(en_US = "websocket;ws;socket;connect;open"),
    display_icon = "tabler:plug-connected",
    linked_data_type_identifiers("WEBSOCKET_CONNECT_INPUT"),
    editable
)]
#[setting(
    identifier = "ws_connect_path",
    unique = "project",
    name(en_US = "Path"),
    description(en_US = "The WebSocket endpoint path this flow listens on (e.g. /chat)."),
    linked_data_type_identifiers("HTTP_URL")
)]
#[setting(
    identifier = "ws_auth",
    name(en_US = "Authentication type"),
    description(
        en_US = "Specifies the authentication mechanism required for the incoming WebSocket handshake (e.g. Bearer JWT, Bearer static, Basic)."
    ),
    linked_data_type_identifiers("WEBSOCKET_AUTH_TYPE"),
    optional
)]
#[setting(
    identifier = "ws_auth_value",
    name(en_US = "Authentication value"),
    description(
        en_US = "Provides the credential value matching the selected authentication type (e.g. token string or username/password pair)."
    ),
    linked_data_type_identifiers("WEBSOCKET_AUTH_VALUE"),
    optional
)]
pub struct WsConnectRuntimeEvent;

#[hercules::runtime_event(
    identifier = "WEBSOCKET_MESSAGE",
    signature = "<T>(ws_message_path: HTTP_URL, input_schema: TYPE<T>): WEBSOCKET_MESSAGE_INPUT<T>",
    name(en_US = "WebSocket Message Received"),
    description(
        en_US = "Fires for every inbound WebSocket frame (text or binary) received on a connection to the configured path. Runs fire-and-forget, one flow execution per message; there is no built-in request/response correlation, use the 'send' function to push a reply back out on the same connection."
    ),
    display_message(en_US = "WebSocket message received on ${ws_message_path}"),
    alias(en_US = "websocket;ws;socket;message;frame"),
    display_icon = "tabler:message-2",
    linked_data_type_identifiers("WEBSOCKET_MESSAGE_INPUT"),
    editable
)]
#[setting(
    identifier = "ws_message_path",
    unique = "project",
    name(en_US = "Path"),
    description(en_US = "The WebSocket endpoint path this flow listens on (e.g. /chat)."),
    linked_data_type_identifiers("HTTP_URL")
)]
#[setting(
    identifier = "input_schema",
    name(en_US = "Input schema"),
    description(
        en_US = "Input schema which defines the expected structure of an incoming message's payload (used only when the message is text and parses as JSON)."
    ),
    optional
)]
pub struct WsMessageRuntimeEvent;

#[hercules::runtime_event(
    identifier = "WEBSOCKET_DISCONNECT",
    signature = "(ws_disconnect_path: HTTP_URL): WEBSOCKET_DISCONNECT_INPUT",
    name(en_US = "WebSocket Disconnected"),
    description(
        en_US = "Fires once when a connection to the configured path closes, whether cleanly (a close frame) or due to an error (the connection dropping)."
    ),
    display_message(en_US = "WebSocket client disconnected on ${ws_disconnect_path}"),
    alias(en_US = "websocket;ws;socket;disconnect;close"),
    display_icon = "tabler:plug-connected-x",
    linked_data_type_identifiers("WEBSOCKET_DISCONNECT_INPUT"),
    editable
)]
#[setting(
    identifier = "ws_disconnect_path",
    unique = "project",
    name(en_US = "Path"),
    description(en_US = "The WebSocket endpoint path this flow listens on (e.g. /chat)."),
    linked_data_type_identifiers("HTTP_URL")
)]
pub struct WsDisconnectRuntimeEvent;

#[hercules::runtime_event(
    identifier = "WEBSOCKET_ERROR",
    signature = "(ws_error_path: HTTP_URL): WEBSOCKET_ERROR_INPUT",
    name(en_US = "WebSocket Error"),
    description(
        en_US = "Fires when a protocol-level error occurs on a connection to the configured path (e.g. a malformed frame). This does not necessarily mean the connection was closed; a 'WebSocket Disconnected' event follows separately once it actually closes."
    ),
    display_message(en_US = "WebSocket error on ${ws_error_path}"),
    alias(en_US = "websocket;ws;socket;error"),
    display_icon = "tabler:alert-triangle",
    linked_data_type_identifiers("WEBSOCKET_ERROR_INPUT"),
    editable
)]
#[setting(
    identifier = "ws_error_path",
    unique = "project",
    name(en_US = "Path"),
    description(en_US = "The WebSocket endpoint path this flow listens on (e.g. /chat)."),
    linked_data_type_identifiers("HTTP_URL")
)]
pub struct WsErrorRuntimeEvent;
