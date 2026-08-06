use hyper::{StatusCode, header::HeaderValue};

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub(crate) enum AuthenticationType {
    BearerJwt,
    BearerStatic,
    Basic,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum AuthenticationError {
    MissingAuthorization(AuthenticationType),
    InvalidAuthorizationFor(AuthenticationType),
    InvalidAuthorization,
}

impl AuthenticationError {
    pub(super) fn missing_for(auth_type: AuthenticationType) -> Self {
        Self::MissingAuthorization(auth_type)
    }

    pub(super) fn invalid_for(auth_type: AuthenticationType) -> Self {
        Self::InvalidAuthorizationFor(auth_type)
    }

    pub fn status_code(self) -> StatusCode {
        StatusCode::UNAUTHORIZED
    }

    pub fn message(self) -> &'static str {
        match self {
            Self::MissingAuthorization(_) => "Missing authorization",
            Self::InvalidAuthorizationFor(_) | Self::InvalidAuthorization => {
                "Invalid authorization"
            }
        }
    }

    pub fn challenge(self) -> HeaderValue {
        match self.auth_type() {
            Some(AuthenticationType::BearerJwt | AuthenticationType::BearerStatic) => {
                HeaderValue::from_static("Bearer")
            }
            Some(AuthenticationType::Basic) => HeaderValue::from_static("Basic"),
            None => HeaderValue::from_static("Bearer"),
        }
    }

    fn auth_type(self) -> Option<AuthenticationType> {
        match self {
            Self::MissingAuthorization(auth_type) | Self::InvalidAuthorizationFor(auth_type) => {
                Some(auth_type)
            }
            Self::InvalidAuthorization => None,
        }
    }
}

impl AuthenticationType {
    pub(super) fn parse(value: &str) -> Option<Self> {
        let normalized = normalize_auth_type(value);

        match normalized.as_str() {
            "bearerjwt" | "jwt" => Some(Self::BearerJwt),
            "bearerstatic" | "bearer" | "staticbearer" => Some(Self::BearerStatic),
            "basicaccessauth" | "basic" | "basicauth" => Some(Self::Basic),
            _ => None,
        }
    }
}

pub(super) fn is_unauthenticated_value(value: &str) -> bool {
    matches!(
        normalize_auth_type(value).as_str(),
        "" | "none" | "noauth" | "unauthenticated"
    )
}

fn normalize_auth_type(value: &str) -> String {
    value
        .trim()
        .replace(['_', '-', ' '], "")
        .to_ascii_lowercase()
}

#[cfg(test)]
mod tests {
    use super::{AuthenticationType, is_unauthenticated_value};

    #[test]
    fn rest_auth_type_values_parse() {
        assert_eq!(
            AuthenticationType::parse("Bearer JWT"),
            Some(AuthenticationType::BearerJwt)
        );
        assert_eq!(
            AuthenticationType::parse("Bearer static"),
            Some(AuthenticationType::BearerStatic)
        );
        assert_eq!(
            AuthenticationType::parse("Basic"),
            Some(AuthenticationType::Basic)
        );
    }

    #[test]
    fn unauthenticated_values_are_explicit() {
        assert!(is_unauthenticated_value("unauthenticated"));
        assert!(is_unauthenticated_value("no-auth"));
        assert!(is_unauthenticated_value("none"));
        assert!(is_unauthenticated_value(""));
    }
}
