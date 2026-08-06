//! HTTP/webhook-shaped data types the `REST` event's settings and the
//! `respond` function's parameters are typed against.

use hercules::JsonSchema;
use serde::{Deserialize, Serialize};

#[hercules::data_type(
    identifier = "HTTP_METHOD",
    name(en_US = "HTTP Method"),
    display_message(en_US = "HTTP Method"),
    alias(en_US = "http;method;get;post;put;delete;path;head")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct HttpMethod(
    #[schemars(regex(pattern = r"^(GET|POST|PUT|DELETE|PATCH|HEAD)$"))] pub String,
);

#[hercules::data_type(
    identifier = "HTTP_URL",
    name(en_US = "HTTP Route"),
    display_message(en_US = "HTTP Route"),
    alias(en_US = "http;route;url")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct HttpUrl(
    #[schemars(regex(pattern = r"^/\w+(?:[.:~-]\w+)*(?:/\w+(?:[.:~-]\w+)*)*$"))] pub String,
);

#[hercules::data_type(
    identifier = "HTTP_SCHEMA",
    name(en_US = "HTTP schema"),
    display_message(en_US = "HTTP schema"),
    alias(en_US = "http;schema;content-type;mime;media-type;json;xml;text;csv")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct HttpSchema(pub String);

#[hercules::data_type(
    identifier = "HTTP_STATUS_CODE",
    name(en_US = "HTTP Status Code"),
    display_message(en_US = "HTTP Status Code"),
    alias(en_US = "http;status;code")
)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct HttpStatusCode(#[schemars(range(min = 100, max = 599))] pub i64);

#[hercules::data_type(
    identifier = "HTTP_PAYLOAD",
    name(en_US = "HTTP payload"),
    display_message(en_US = "HTTP payload"),
    alias(en_US = "http;payload;body;content;data;json"),
    generic_keys("T")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct HttpPayload(pub serde_json::Value);

#[hercules::data_type(
    identifier = "REST_AUTH_TYPE",
    name(en_US = "Webhook credential variant"),
    display_message(en_US = "Webhook credential variant"),
    alias(en_US = "webhook;rest;auth;credential;type;variant;bearer;basic;jwt")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct RestAuthType(
    #[schemars(regex(pattern = r"^(Bearer JWT|Bearer static|Basic)$"))] pub String,
);

#[hercules::data_type(
    identifier = "REST_AUTH_VALUE",
    name(en_US = "Webhook credential value"),
    display_message(en_US = "Webhook credential value"),
    alias(en_US = "webhook;rest;auth;credential;value;bearer;basic;username;password;token"),
    generic_keys("T")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct RestAuthValue(pub serde_json::Value);

#[hercules::data_type(
    identifier = "REST_ADAPTER_INPUT",
    name(en_US = "Rest Adapter Input"),
    display_message(en_US = "Rest Adapter Input"),
    alias(en_US = "http;rest;adapter;input"),
    generic_keys("T")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct RestAdapterInput {
    pub payload: serde_json::Value,
    pub headers: std::collections::HashMap<String, String>,
    pub query_params: std::collections::HashMap<String, String>,
    pub path_params: std::collections::HashMap<String, String>,
}
