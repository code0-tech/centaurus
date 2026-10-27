use base64::Engine;
use ring::hmac;
use std::time::{SystemTime, UNIX_EPOCH};

pub(super) fn validate_hs256_jwt(authorization: &str, secret: &str) -> bool {
    let Some(token) = authorization.trim().strip_prefix("Bearer ") else {
        return false;
    };

    validate_token(token, secret)
}

fn validate_token(token: &str, secret: &str) -> bool {
    let mut segments = token.split('.');
    let Some(header_segment) = segments.next() else {
        return false;
    };
    let Some(payload_segment) = segments.next() else {
        return false;
    };
    let Some(signature_segment) = segments.next() else {
        return false;
    };

    if segments.next().is_some() {
        return false;
    }

    let Some(header) = decode_json_segment(header_segment) else {
        return false;
    };

    // The flow stores only one shared secret, so JWT auth is intentionally
    // limited to HS256. Supporting RS/ES algorithms would require a public
    // key or JWKS setting instead of a secret string.
    if header.get("alg").and_then(|alg| alg.as_str()) != Some("HS256") {
        return false;
    }

    if !verify_signature(header_segment, payload_segment, signature_segment, secret) {
        return false;
    }

    let Some(payload) = decode_json_segment(payload_segment) else {
        return false;
    };

    token_is_not_expired(&payload)
}

fn verify_signature(
    header_segment: &str,
    payload_segment: &str,
    signature_segment: &str,
    secret: &str,
) -> bool {
    let Some(signature) = decode_base64_url(signature_segment) else {
        return false;
    };

    let signing_input = format!("{header_segment}.{payload_segment}");
    let key = hmac::Key::new(hmac::HMAC_SHA256, secret.as_bytes());

    hmac::verify(&key, signing_input.as_bytes(), &signature).is_ok()
}

fn token_is_not_expired(payload: &serde_json::Value) -> bool {
    let Some(exp) = payload.get("exp").and_then(|exp| exp.as_i64()) else {
        return true;
    };

    let Ok(now) = SystemTime::now().duration_since(UNIX_EPOCH) else {
        return false;
    };

    exp > now.as_secs() as i64
}

fn decode_json_segment(segment: &str) -> Option<serde_json::Value> {
    let bytes = decode_base64_url(segment)?;
    serde_json::from_slice::<serde_json::Value>(&bytes).ok()
}

fn decode_base64_url(value: &str) -> Option<Vec<u8>> {
    base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(value)
        .or_else(|_| base64::engine::general_purpose::URL_SAFE.decode(value))
        .ok()
}

#[cfg(test)]
pub(crate) mod tests {
    use base64::Engine;
    use ring::hmac;

    use super::validate_hs256_jwt;

    #[test]
    fn verifies_hs256_token() {
        let token = create_hs256_jwt("jwt-secret", r#"{"sub":"123"}"#);
        assert!(validate_hs256_jwt(&format!("Bearer {token}"), "jwt-secret"));
    }

    #[test]
    fn rejects_expired_token() {
        let token = create_hs256_jwt("jwt-secret", r#"{"exp":1}"#);
        assert!(!validate_hs256_jwt(
            &format!("Bearer {token}"),
            "jwt-secret"
        ));
    }

    #[test]
    fn rejects_wrong_secret() {
        let token = create_hs256_jwt("jwt-secret", r#"{"sub":"123"}"#);
        assert!(!validate_hs256_jwt(&format!("Bearer {token}"), "wrong"));
    }

    pub(crate) fn create_hs256_jwt(secret: &str, payload: &str) -> String {
        let header = r#"{"alg":"HS256","typ":"JWT"}"#;
        let header_segment = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(header);
        let payload_segment = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(payload);
        let signing_input = format!("{header_segment}.{payload_segment}");
        let key = hmac::Key::new(hmac::HMAC_SHA256, secret.as_bytes());
        let signature = hmac::sign(&key, signing_input.as_bytes());
        let signature_segment =
            base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(signature.as_ref());

        format!("{signing_input}.{signature_segment}")
    }
}
