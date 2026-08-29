use base64::Engine;
use tucana::shared::{Struct, Value, value::Kind};

use super::jwt::validate_hs256_jwt;
use super::types::AuthenticationType;

pub(super) fn matches_authorization(
    auth_type: AuthenticationType,
    auth_value: &Value,
    authorization: &str,
) -> bool {
    match auth_type {
        AuthenticationType::BearerJwt => {
            let Some(secret) = value_as_string(auth_value) else {
                return false;
            };
            validate_hs256_jwt(authorization, secret)
        }
        AuthenticationType::BearerStatic => {
            let Some(expected_token) = value_as_string(auth_value) else {
                return false;
            };
            authorization.trim() == format!("Bearer {}", expected_token.trim())
        }
        AuthenticationType::Basic => {
            let Some(credentials) = basic_credentials(auth_value) else {
                return false;
            };
            let expected_encoded =
                base64::engine::general_purpose::STANDARD.encode(credentials.as_bytes());
            authorization.trim() == format!("Basic {}", expected_encoded)
        }
    }
}

/// Builds the `Authorization` header value to *send* on an outbound client
/// handshake, given the flow's configured auth type/value — the inverse of
/// [`matches_authorization`], which *validates* an inbound one.
///
/// `BearerJwt` and `BearerStatic` are handled identically here: this action
/// doesn't mint JWTs (it only validates HS256 signatures on the inbound
/// side, see `jwt.rs`), so a `Bearer JWT`-configured outbound connection just
/// sends the configured value verbatim as the bearer token, same as
/// `Bearer static`. The operator is expected to supply an already-encoded
/// token in that case.
pub(super) fn build_authorization_header(
    auth_type: AuthenticationType,
    auth_value: &Value,
) -> Option<String> {
    match auth_type {
        AuthenticationType::BearerJwt | AuthenticationType::BearerStatic => {
            value_as_string(auth_value).map(|token| format!("Bearer {}", token.trim()))
        }
        AuthenticationType::Basic => {
            let credentials = basic_credentials(auth_value)?;
            let encoded = base64::engine::general_purpose::STANDARD.encode(credentials.as_bytes());
            Some(format!("Basic {encoded}"))
        }
    }
}

fn basic_credentials(value: &Value) -> Option<String> {
    if let Some(credentials) = value_as_string(value) {
        return Some(credentials.trim().to_string());
    }

    let Some(Kind::StructValue(Struct { fields })) = value.kind.as_ref() else {
        return None;
    };

    let username = fields
        .get("username")
        .or_else(|| fields.get("user"))
        .and_then(value_as_string)?;
    let password = fields
        .get("password")
        .or_else(|| fields.get("pass"))
        .and_then(value_as_string)?;

    Some(format!("{username}:{password}"))
}

fn value_as_string(value: &Value) -> Option<&str> {
    match value.kind.as_ref() {
        Some(Kind::StringValue(value)) => Some(value.as_str()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use tucana::shared::{Struct, Value, value::Kind};

    use super::matches_authorization;
    use crate::auth::jwt::tests::create_hs256_jwt;
    use crate::auth::types::AuthenticationType;

    #[test]
    fn bearer_static_matches_expected_token() {
        let value = string_value("secret");
        assert!(matches_authorization(
            AuthenticationType::BearerStatic,
            &value,
            "Bearer secret"
        ));
        assert!(!matches_authorization(
            AuthenticationType::BearerStatic,
            &value,
            "Bearer other"
        ));
    }

    #[test]
    fn bearer_jwt_verifies_hs256_token() {
        let secret = string_value("jwt-secret");
        let token = create_hs256_jwt("jwt-secret", r#"{"sub":"123"}"#);
        assert!(matches_authorization(
            AuthenticationType::BearerJwt,
            &secret,
            &format!("Bearer {token}")
        ));
        assert!(!matches_authorization(
            AuthenticationType::BearerJwt,
            &secret,
            "Bearer header.payload.bad-signature"
        ));
    }

    #[test]
    fn basic_matches_encoded_username_password_object_pair() {
        let value = basic_value("user", "pass");
        assert!(matches_authorization(
            AuthenticationType::Basic,
            &value,
            "Basic dXNlcjpwYXNz"
        ));
        assert!(!matches_authorization(
            AuthenticationType::Basic,
            &value,
            "Basic dXNlcjpvdGhlcg=="
        ));
    }

    fn string_value(value: &str) -> Value {
        Value {
            kind: Some(Kind::StringValue(value.to_string())),
        }
    }

    fn basic_value(username: &str, password: &str) -> Value {
        let mut fields = HashMap::new();
        fields.insert("username".to_string(), string_value(username));
        fields.insert("password".to_string(), string_value(password));
        Value {
            kind: Some(Kind::StructValue(Struct { fields })),
        }
    }
}
