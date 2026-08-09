use tucana::aquila::ActionFlow;

use super::types::{AuthenticationType, is_unauthenticated_value};
use crate::flow_setting;

pub(super) enum FlowAuthConfig {
    Unauthenticated,
    Authenticated(AuthenticationType),
    Invalid,
}

/// `auth_setting_id` is the flow setting carrying the auth type (`"ws_auth"`
/// for the inbound handshake, `"ws_client_auth"` for an outbound client
/// connection's handshake — see `auth/mod.rs`'s `validate_flow_auth` and
/// `client_authorization_header` respectively).
pub(super) fn flow_auth_config(flow: &ActionFlow, auth_setting_id: &str) -> FlowAuthConfig {
    let Some(raw_auth_type) = flow_setting::as_string(flow, auth_setting_id) else {
        return FlowAuthConfig::Unauthenticated;
    };

    if is_unauthenticated_value(raw_auth_type) {
        return FlowAuthConfig::Unauthenticated;
    }

    match AuthenticationType::parse(raw_auth_type) {
        Some(auth_type) => FlowAuthConfig::Authenticated(auth_type),
        None => {
            log::warn!(
                "auth config invalid: flow_id={} ws_auth={:?}",
                flow.flow_id,
                raw_auth_type
            );
            FlowAuthConfig::Invalid
        }
    }
}
