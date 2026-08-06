//! Turns a `respond` call (or its absence) into the actual `hyper::Response`
//! sent back to the HTTP client.

use http_body_util::Full;
use hyper::{
    Response, StatusCode,
    body::Bytes,
    header::{HeaderName, HeaderValue},
};
use std::collections::HashMap;

use crate::content_type;
use crate::pending::RespondPayload;

pub fn error_to_http_response(status: StatusCode, msg: &str) -> Response<Full<Bytes>> {
    let body = format!(r#"{{"error": "{}"}}"#, msg);
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap()
}

pub fn no_content_response() -> Response<Full<Bytes>> {
    Response::builder()
        .status(StatusCode::NO_CONTENT)
        .body(Full::new(Bytes::new()))
        .unwrap()
}

pub fn respond_payload_to_http_response(payload: RespondPayload) -> Response<Full<Bytes>> {
    let RespondPayload {
        status_code,
        content_type: header_content_type,
        payload,
        mut headers,
    } = payload;

    if find_header_value_case_insensitive(&headers, "content-type").is_none() {
        headers.insert("content-type".to_string(), header_content_type.clone());
    }
    let content_type_header = find_header_value_case_insensitive(&headers, "content-type");

    let value = tucana::shared::helper::value::from_json_value(payload);
    let encoded_body = match content_type::encode_body(content_type_header, value) {
        Ok(body) => body,
        Err(err) => {
            log::error!("failed to encode response payload: {}", err);
            return error_to_http_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to encode response payload",
            );
        }
    };

    let status = u16::try_from(status_code)
        .ok()
        .and_then(|code| StatusCode::from_u16(code).ok())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    create_http_response(status, headers, encoded_body)
}

fn find_header_value_case_insensitive<'a>(
    headers: &'a HashMap<String, String>,
    key: &str,
) -> Option<&'a str> {
    headers
        .iter()
        .find(|(k, _)| k.eq_ignore_ascii_case(key))
        .map(|(_, v)| v.as_str())
}

fn create_http_response(
    status: StatusCode,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Response<Full<Bytes>> {
    let mut builder = Response::builder().status(status);

    {
        let h = builder.headers_mut().unwrap();
        for (k, v) in headers {
            let name = match HeaderName::from_bytes(k.as_bytes()) {
                Ok(n) => n,
                Err(_) => {
                    log::warn!("dropping invalid header name: {}", k);
                    continue;
                }
            };
            let value = match HeaderValue::from_str(&v) {
                Ok(v) => v,
                Err(_) => {
                    log::warn!("dropping invalid header value for {}: {:?}", k, v);
                    continue;
                }
            };
            h.insert(name, value);
        }
    }

    builder.body(Full::new(Bytes::from(body))).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use http_body_util::BodyExt;

    #[tokio::test]
    async fn respond_payload_is_used_as_response() {
        let payload = RespondPayload {
            status_code: 201,
            content_type: "application/json".to_string(),
            payload: serde_json::json!("response body"),
            headers: [
                ("content-type".to_string(), "text/plain".to_string()),
                ("x-flow-response".to_string(), "matched".to_string()),
            ]
            .into_iter()
            .collect(),
        };

        let response = respond_payload_to_http_response(payload);

        assert_eq!(response.status(), StatusCode::CREATED);
        assert_eq!(response.headers()["content-type"], "text/plain");
        assert_eq!(response.headers()["x-flow-response"], "matched");
        assert_eq!(
            response.into_body().collect().await.unwrap().to_bytes(),
            "response body"
        );
    }

    #[tokio::test]
    async fn finished_flow_without_response_returns_no_content() {
        let response = no_content_response();
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
        assert!(
            response
                .into_body()
                .collect()
                .await
                .unwrap()
                .to_bytes()
                .is_empty()
        );
    }
}
