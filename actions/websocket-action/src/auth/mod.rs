mod credentials;
mod jwt;
mod settings;
mod types;

use std::collections::HashMap;

use http::{HeaderMap, HeaderValue, header::AUTHORIZATION};
use tucana::aquila::ActionFlow;

use self::credentials::{build_authorization_header, matches_authorization};
use self::settings::{FlowAuthConfig, flow_auth_config};
pub use self::types::AuthenticationError;
use crate::flow_setting;

/// Validates a flow's `ws_auth`/`ws_auth_value` settings against the
/// incoming handshake request. Unlike rest-action (an `Authorization`
/// header on every request), a browser `WebSocket` client can't set custom
/// headers at all, so as a fallback a bearer-style token is also accepted
/// via an `access_token` query parameter — `Basic` auth has no such
/// fallback since it needs two values.
pub fn validate_flow_auth(
    flow: &ActionFlow,
    headers: &HeaderMap<HeaderValue>,
    query_params: &HashMap<String, String>,
) -> Result<(), AuthenticationError> {
    let auth_type = match flow_auth_config(flow, "ws_auth") {
        FlowAuthConfig::Unauthenticated => return Ok(()),
        FlowAuthConfig::Invalid => {
            log::warn!(
                "auth reject: flow_id={} reason=invalid_ws_auth",
                flow.flow_id
            );
            return Err(AuthenticationError::InvalidAuthorization);
        }
        FlowAuthConfig::Authenticated(auth_type) => auth_type,
    };

    let Some(auth_value) = flow_setting::value(flow, "ws_auth_value") else {
        log::warn!(
            "auth reject: flow_id={} reason=missing_or_invalid_ws_auth_value",
            flow.flow_id
        );
        return Err(AuthenticationError::invalid_for(auth_type));
    };

    let Some(authorization) = authorization_value(headers, query_params) else {
        log::debug!(
            "auth reject: flow_id={} reason=missing_authorization",
            flow.flow_id
        );
        return Err(AuthenticationError::missing_for(auth_type));
    };

    if matches_authorization(auth_type, auth_value, &authorization) {
        Ok(())
    } else {
        log::debug!(
            "auth reject: flow_id={} reason=authorization_mismatch",
            flow.flow_id
        );
        Err(AuthenticationError::invalid_for(auth_type))
    }
}

/// Builds the `Authorization` header value to send on an outbound client
/// handshake (`client.rs`) from a flow's `ws_client_auth`/
/// `ws_client_auth_value` settings, if configured — the outbound-mode
/// counterpart of [`validate_flow_auth`]. Returns `None` if the flow has no
/// (or an invalid) auth configuration, in which case the handshake is simply
/// sent without an `Authorization` header.
pub fn client_authorization_header(flow: &ActionFlow) -> Option<String> {
    let auth_type = match flow_auth_config(flow, "ws_client_auth") {
        FlowAuthConfig::Unauthenticated => return None,
        FlowAuthConfig::Invalid => {
            log::warn!(
                "client auth config invalid: flow_id={} reason=invalid_ws_client_auth",
                flow.flow_id
            );
            return None;
        }
        FlowAuthConfig::Authenticated(auth_type) => auth_type,
    };

    let Some(auth_value) = flow_setting::value(flow, "ws_client_auth_value") else {
        log::warn!(
            "client auth config missing value: flow_id={} reason=missing_ws_client_auth_value",
            flow.flow_id
        );
        return None;
    };

    build_authorization_header(auth_type, auth_value)
}

/// The effective `Authorization`-style header value: the real header if
/// present, otherwise a synthetic `Bearer <token>` built from the
/// `access_token` query parameter (see the module doc).
fn authorization_value(
    headers: &HeaderMap<HeaderValue>,
    query_params: &HashMap<String, String>,
) -> Option<String> {
    if let Some(value) = headers.get(AUTHORIZATION).and_then(|v| v.to_str().ok()) {
        return Some(value.to_string());
    }

    query_params
        .get("access_token")
        .map(|token| format!("Bearer {token}"))
}
