//! Data types specific to this adapter.

use hercules_sdk::JsonSchema;
use serde::{Deserialize, Serialize};

#[hercules_sdk::data_type(
    identifier = "REST_AUTH_TYPE",
    name(en_US = "Webhook credential variant"),
    display_message(en_US = "Webhook credential variant"),
    alias(en_US = "webhook;rest;auth;credential;type;variant;bearer;basic;jwt"),
    // A closed string union with `undefined`/`null` isn't representable via
    // schemars/JSON Schema on a Rust type, so the structural type is
    // hand-written to match code0-definition's reference exactly.
    type_override = "'Bearer JWT' | 'Bearer static' | 'Basic' | undefined | null"
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct RestAuthType(pub String);

#[hercules_sdk::data_type(
    identifier = "REST_AUTH_VALUE",
    name(en_US = "Webhook credential value"),
    display_message(en_US = "Webhook credential value"),
    alias(en_US = "webhook;rest;auth;credential;value;bearer;basic;username;password;token"),
    generic_keys("T"),
    // A generic-conditional type keyed off `REST_AUTH_TYPE`'s value isn't
    // representable via schemars either, so it's hand-written to match the
    // reference.
    type_override = "T extends 'Basic' ? { username: string, password: string } : T extends undefined ? undefined : T extends null ? null : string"
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct RestAuthValue(pub serde_json::Value);

#[hercules_sdk::data_type(
    identifier = "REST_ADAPTER_INPUT",
    name(en_US = "Rest Adapter Input"),
    display_message(en_US = "Rest Adapter Input"),
    alias(en_US = "http;rest;adapter;input"),
    generic_keys("T"),
    type_override = "{ payload: T, headers: OBJECT<{}>, query_params: OBJECT<{}>, path_params: OBJECT<{}> }",
    linked_data_type_identifiers("OBJECT")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RestAdapterInput {
    pub payload: serde_json::Value,
    pub headers: std::collections::HashMap<String, String>,
    pub query_params: std::collections::HashMap<String, String>,
    pub path_params: std::collections::HashMap<String, String>,
}
