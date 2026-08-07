mod credentials;
mod jwt;
mod settings;
mod types;

use hyper::{
    HeaderMap,
    header::{AUTHORIZATION, HeaderValue, WWW_AUTHENTICATE},
};
use tucana::aquila::ActionFlow;

use self::credentials::matches_authorization;
use self::settings::{FlowAuthConfig, flow_auth_config};
pub use self::types::AuthenticationError;
use crate::flow_setting;

pub fn validate_flow_auth(
    flow: &ActionFlow,
    headers: &HeaderMap<HeaderValue>,
) -> Result<(), AuthenticationError> {
    let auth_type = match flow_auth_config(flow) {
        FlowAuthConfig::Unauthenticated => return Ok(()),
        FlowAuthConfig::Invalid => {
            log::warn!(
                "auth reject: flow_id={} reason=invalid_http_auth",
                flow.flow_id
            );
            return Err(AuthenticationError::InvalidAuthorization);
        }
        FlowAuthConfig::Authenticated(auth_type) => auth_type,
    };

    let Some(auth_value) = flow_setting::value(flow, "http_auth_value") else {
        log::warn!(
            "auth reject: flow_id={} reason=missing_or_invalid_http_auth_value",
            flow.flow_id
        );
        return Err(AuthenticationError::invalid_for(auth_type));
    };

    let Some(authorization) = headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
    else {
        log::debug!(
            "auth reject: flow_id={} reason=missing_authorization",
            flow.flow_id
        );
        return Err(AuthenticationError::missing_for(auth_type));
    };

    if matches_authorization(auth_type, auth_value, authorization) {
        Ok(())
    } else {
        log::debug!(
            "auth reject: flow_id={} reason=authorization_mismatch",
            flow.flow_id
        );
        Err(AuthenticationError::invalid_for(auth_type))
    }
}

pub fn authenticate_header_name() -> hyper::header::HeaderName {
    WWW_AUTHENTICATE
}
