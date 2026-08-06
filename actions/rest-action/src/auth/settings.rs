use tucana::aquila::ActionFlow;

use super::types::{AuthenticationType, is_unauthenticated_value};
use crate::flow_setting;

pub(super) enum FlowAuthConfig {
    Unauthenticated,
    Authenticated(AuthenticationType),
    Invalid,
}

pub(super) fn flow_auth_config(flow: &ActionFlow) -> FlowAuthConfig {
    let Some(raw_auth_type) = flow_setting::as_string(flow, "http_auth") else {
        return FlowAuthConfig::Unauthenticated;
    };

    if is_unauthenticated_value(raw_auth_type) {
        return FlowAuthConfig::Unauthenticated;
    }

    match AuthenticationType::parse(raw_auth_type) {
        Some(auth_type) => FlowAuthConfig::Authenticated(auth_type),
        None => {
            log::warn!(
                "auth config invalid: flow_id={} http_auth={:?}",
                flow.flow_id,
                raw_auth_type
            );
            FlowAuthConfig::Invalid
        }
    }
}
