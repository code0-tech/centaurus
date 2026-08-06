//! The `REST` flow trigger.
//!
//! Registering this `RuntimeEvent` is what lets users attach a flow to an
//! HTTP route in the platform UI; Aquila then pushes each such flow down to
//! this action as an `ActionFlow` with these six settings filled in per
//! flow. `server.rs` matches incoming requests against those settings.

#[hercules::runtime_event(
    identifier = "REST",
    signature = "<A extends REST_AUTH_TYPE, T>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema: TYPE<T>): REST_ADAPTER_INPUT<T>",
    name(en_US = "Webhook"),
    description(
        en_US = "A Webhook is an HTTP endpoint that listens for incoming requests from external services or clients, allowing you to react to events in real time using standard HTTP methods like GET, POST, PUT, and DELETE."
    ),
    display_message(en_US = "Webhook on ${http_method} at ${http_url}"),
    alias(en_US = "webhook;http;rest;route;web"),
    display_icon = "tabler:world-www",
    editable
)]
#[setting(
    identifier = "http_schema",
    name(en_US = "Content Type"),
    description(
        en_US = "Specifies the MIME type of the incoming request payload, such as application/json, application/xml, or text/plain. This determines the expected format of the payload parameter."
    ),
    linked_data_type_identifiers("HTTP_SCHEMA")
)]
#[setting(
    identifier = "http_url",
    unique = "project",
    name(en_US = "URL"),
    description(en_US = "Specifies the HTTP URL endpoint."),
    linked_data_type_identifiers("HTTP_URL")
)]
#[setting(
    identifier = "http_method",
    name(en_US = "Method"),
    description(en_US = "Specifies the HTTP request method (e.g., GET, POST, PUT, DELETE)."),
    linked_data_type_identifiers("HTTP_METHOD")
)]
#[setting(
    identifier = "http_auth",
    name(en_US = "Authentication type"),
    description(
        en_US = "Specifies the authentication mechanism used for the incoming Webhook request (e.g., Bearer JWT, Bearer static, Basic)."
    ),
    linked_data_type_identifiers("REST_AUTH_TYPE"),
    optional
)]
#[setting(
    identifier = "http_auth_value",
    name(en_US = "Authentication value"),
    description(
        en_US = "Provides the credential value matching the selected authentication type (e.g., token string or username/password pair)."
    ),
    linked_data_type_identifiers("REST_AUTH_VALUE"),
    optional
)]
#[setting(
    identifier = "input_schema",
    name(en_US = "Input schema"),
    description(
        en_US = "Input schema which defines the expected structure of the incoming request data."
    ),
    optional
)]
pub struct RestRuntimeEvent;
