//! Data types specific to this adapter.

use hercules::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[hercules::data_type(
    identifier = "WEBSOCKET_AUTH_TYPE",
    name(en_US = "WebSocket credential variant"),
    display_message(en_US = "WebSocket credential variant"),
    alias(en_US = "websocket;ws;auth;credential;type;variant;bearer;basic;jwt"),
    // A closed string union with `undefined`/`null` isn't representable via
    // schemars/JSON Schema on a Rust type, so the structural type is
    // hand-written to match code0-definition's reference exactly (mirrors
    // rest-action's REST_AUTH_TYPE).
    type_override = "'Bearer JWT' | 'Bearer static' | 'Basic' | undefined | null"
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct WebsocketAuthType(pub String);

#[hercules::data_type(
    identifier = "WEBSOCKET_AUTH_VALUE",
    name(en_US = "WebSocket credential value"),
    display_message(en_US = "WebSocket credential value"),
    alias(en_US = "websocket;ws;auth;credential;value;bearer;basic;username;password;token"),
    generic_keys("T"),
    type_override = "T extends 'Basic' ? { username: string, password: string } : T extends undefined ? undefined : T extends null ? null : string"
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct WebsocketAuthValue(pub serde_json::Value);

#[hercules::data_type(
    identifier = "WEBSOCKET_CONNECT_INPUT",
    name(en_US = "WebSocket Connect Input"),
    display_message(en_US = "WebSocket Connect Input"),
    alias(en_US = "websocket;ws;connect;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketConnectInput {
    /// A locally-unique id for this connection. Pass it to `send` (via the
    /// flow execution it triggers) to push a frame back out on it — see
    /// `functions.rs`.
    pub connection_id: String,
    pub path: String,
    pub headers: HashMap<String, String>,
    pub query_params: HashMap<String, String>,
    pub path_params: HashMap<String, String>,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_MESSAGE_INPUT",
    name(en_US = "WebSocket Message Input"),
    display_message(en_US = "WebSocket Message Input"),
    alias(en_US = "websocket;ws;message;input"),
    generic_keys("T"),
    type_override = "{ connection_id: TEXT, path: TEXT, is_binary: BOOLEAN, payload: T, path_params: OBJECT<{}> }",
    linked_data_type_identifiers("TEXT", "BOOLEAN", "OBJECT")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketMessageInput {
    pub connection_id: String,
    pub path: String,
    /// `true` if the inbound frame was a binary frame. Binary payloads are
    /// carried as a base64-encoded string; text payloads are carried as
    /// parsed JSON when they parse as JSON, or as a plain string otherwise.
    pub is_binary: bool,
    pub payload: serde_json::Value,
    pub path_params: HashMap<String, String>,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_DISCONNECT_INPUT",
    name(en_US = "WebSocket Disconnect Input"),
    display_message(en_US = "WebSocket Disconnect Input"),
    alias(en_US = "websocket;ws;disconnect;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketDisconnectInput {
    pub connection_id: String,
    pub path: String,
    /// The WebSocket close code, if the peer (or this action) sent a close
    /// frame. Absent for an ungraceful disconnect (e.g. TCP reset).
    pub code: Option<u16>,
    pub reason: Option<String>,
    /// `true` if the connection closed via a clean close-frame handshake,
    /// `false` if it dropped due to an error/reset.
    pub was_clean: bool,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_ERROR_INPUT",
    name(en_US = "WebSocket Error Input"),
    display_message(en_US = "WebSocket Error Input"),
    alias(en_US = "websocket;ws;error;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketErrorInput {
    pub connection_id: String,
    pub path: String,
    pub message: String,
}

// -- Outbound (client) data types --------------------------------------------
//
// Same field shape as the inbound `Websocket*Input` types above, minus
// `path`/`path_params` (a client connection isn't routed by an inbound path;
// see events.rs's module doc). `url` carries the target URL instead, so a
// flow can tell which outbound connection an event came from.

#[hercules::data_type(
    identifier = "WEBSOCKET_CLIENT_CONNECT_INPUT",
    name(en_US = "WebSocket Client Connect Input"),
    display_message(en_US = "WebSocket Client Connect Input"),
    alias(en_US = "websocket;ws;client;connect;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketClientConnectInput {
    /// A locally-unique id for this connection. Pass it to `send` (via the
    /// flow execution it triggers) to push a frame back out on it — see
    /// `functions.rs`.
    pub connection_id: String,
    pub url: String,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_CLIENT_MESSAGE_INPUT",
    name(en_US = "WebSocket Client Message Input"),
    display_message(en_US = "WebSocket Client Message Input"),
    alias(en_US = "websocket;ws;client;message;input"),
    generic_keys("T"),
    type_override = "{ connection_id: TEXT, url: TEXT, is_binary: BOOLEAN, payload: T }",
    linked_data_type_identifiers("TEXT", "BOOLEAN")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketClientMessageInput {
    pub connection_id: String,
    pub url: String,
    /// `true` if the inbound frame was a binary frame. Binary payloads are
    /// carried as a base64-encoded string; text payloads are carried as
    /// parsed JSON when they parse as JSON, or as a plain string otherwise.
    pub is_binary: bool,
    pub payload: serde_json::Value,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_CLIENT_DISCONNECT_INPUT",
    name(en_US = "WebSocket Client Disconnect Input"),
    display_message(en_US = "WebSocket Client Disconnect Input"),
    alias(en_US = "websocket;ws;client;disconnect;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketClientDisconnectInput {
    pub connection_id: String,
    pub url: String,
    /// The WebSocket close code, if the peer (or this action) sent a close
    /// frame. Absent for an ungraceful disconnect (e.g. TCP reset) or a
    /// failed connection attempt.
    pub code: Option<u16>,
    pub reason: Option<String>,
    /// `true` if the connection closed via a clean close-frame handshake,
    /// `false` if it dropped due to an error/reset/failed connection attempt.
    pub was_clean: bool,
}

#[hercules::data_type(
    identifier = "WEBSOCKET_CLIENT_ERROR_INPUT",
    name(en_US = "WebSocket Client Error Input"),
    display_message(en_US = "WebSocket Client Error Input"),
    alias(en_US = "websocket;ws;client;error;input")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct WebsocketClientErrorInput {
    pub connection_id: String,
    pub url: String,
    pub message: String,
}
