//! Request body limits: a size cap, checked before doing any work with the
//! body (against `Content-Length` up front when present, and while
//! streaming otherwise, since a client can omit `Content-Length` or lie
//! about it), and a read timeout — without one, a slow client that trickles
//! bytes in under the size cap can hold the request (and, since admission is
//! acquired before the body is read, an admission permit) open
//! indefinitely.

use std::time::Duration;

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

#[derive(Clone, Copy)]
pub struct BodyLimits {
    pub max_bytes: u64,
    pub read_timeout: Duration,
}

impl BodyLimits {
    pub fn from_env() -> Self {
        let max_bytes: u64 = env("HERCULES_REST_MAX_BODY_BYTES", "10485760")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_MAX_BODY_BYTES: {err}"));
        let read_timeout_secs: u64 = env("HERCULES_REST_BODY_READ_TIMEOUT_SECS", "30")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_BODY_READ_TIMEOUT_SECS: {err}"));
        Self {
            max_bytes,
            read_timeout: Duration::from_secs(read_timeout_secs),
        }
    }

    /// `true` when a declared `Content-Length` already exceeds the limit —
    /// callers should reject with `413` before touching the body stream.
    pub fn exceeds_declared_length(&self, headers: &hyper::HeaderMap) -> bool {
        headers
            .get(hyper::header::CONTENT_LENGTH)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.parse::<u64>().ok())
            .is_some_and(|declared| declared > self.max_bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hyper::HeaderMap;
    use hyper::header::CONTENT_LENGTH;

    #[test]
    fn accepts_declared_length_within_the_limit() {
        let limits = BodyLimits {
            max_bytes: 1024,
            read_timeout: Duration::from_secs(30),
        };
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_LENGTH, "1024".parse().unwrap());
        assert!(!limits.exceeds_declared_length(&headers));
    }

    #[test]
    fn rejects_declared_length_over_the_limit() {
        let limits = BodyLimits {
            max_bytes: 1024,
            read_timeout: Duration::from_secs(30),
        };
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_LENGTH, "1025".parse().unwrap());
        assert!(limits.exceeds_declared_length(&headers));
    }

    #[test]
    fn missing_content_length_is_not_rejected_up_front() {
        let limits = BodyLimits {
            max_bytes: 1024,
            read_timeout: Duration::from_secs(30),
        };
        assert!(!limits.exceeds_declared_length(&HeaderMap::new()));
    }
}
