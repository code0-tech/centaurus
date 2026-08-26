//! Request/response body <-> `tucana::shared::Value` conversion, keyed off
//! the HTTP `content-type` header. Both directions go through the same
//! `format_for_content_type` mapping and the same lupus engine, so every
//! format lupus supports (JSON, XML, HTML, CSV, form-urlencoded, plain
//! text) works identically for parsing an incoming request body and for
//! encoding an outgoing response body, so there's no format one side accepts
//! that the other rejects.

use hyper::{
    HeaderMap,
    header::{CONTENT_TYPE, HeaderValue},
};
use tucana::shared::Value;

#[derive(Debug)]
pub enum BodyParseError {
    UnsupportedContentType {
        observed: String,
    },
    InvalidJson(serde_json::Error),
    Conversion {
        content_type: String,
        source: lupus::ConvertError,
    },
}

impl std::fmt::Display for BodyParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedContentType { observed } => {
                write!(f, "unsupported content type: {}", observed)
            }
            Self::InvalidJson(err) => write!(f, "invalid JSON body: {}", err),
            Self::Conversion {
                content_type,
                source,
            } => write!(
                f,
                "unable to parse request payload as '{}': {}",
                content_type, source
            ),
        }
    }
}

impl std::error::Error for BodyParseError {}

#[derive(Debug)]
pub enum BodyEncodeError {
    UnsupportedContentType {
        observed: String,
    },
    InvalidJson(serde_json::Error),
    Conversion {
        content_type: String,
        source: lupus::ConvertError,
    },
}

impl std::fmt::Display for BodyEncodeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedContentType { observed } => {
                write!(f, "unsupported content type: {}", observed)
            }
            Self::InvalidJson(err) => write!(f, "failed to encode JSON body: {}", err),
            Self::Conversion {
                content_type,
                source,
            } => write!(
                f,
                "unable to convert response payload to '{}': {}",
                content_type, source
            ),
        }
    }
}

impl std::error::Error for BodyEncodeError {}

pub fn parse_body_from_headers(
    headers: &HeaderMap<HeaderValue>,
    body: &[u8],
) -> Result<Option<Value>, BodyParseError> {
    parse_body(get_content_type(headers), body)
}

thread_local! {
    // `lupus::Codec` trait objects aren't `Send + Sync` (the trait doesn't
    // require it, even though every concrete codec lupus ships is a
    // zero-sized, stateless struct) — so `Engine` can't be shared behind a
    // single `'static` reference across worker threads. A thread-local
    // built once per tokio worker thread and reused across every request
    // that thread handles is the thread-safe way to still avoid
    // reconstructing the codec map on every non-JSON request.
    static ENGINE: lupus::Engine = lupus::Engine::with_default_codecs();
}

pub fn parse_body(
    content_type: Option<&str>,
    body: &[u8],
) -> Result<Option<Value>, BodyParseError> {
    if body.is_empty() {
        return Ok(None);
    }

    // No content-type header at all: best-effort as plain text, same as a
    // request that explicitly says `text/plain`.
    let format = match content_type {
        Some(content_type) => format_for_content_type(content_type)
            .map_err(|observed| BodyParseError::UnsupportedContentType { observed })?,
        None => lupus::Format::Text,
    };

    // JSON is the dominant content type, and going through lupus's generic
    // engine for it means two extra JSON (de)serialize passes and a `Data`
    // tree in between, just to end up back at a `tucana::shared::Value` —
    // something `from_json_value` already does directly. Every other format
    // (XML, HTML, CSV, form-urlencoded, plain text) still goes through the
    // shared `Engine`.
    if format == lupus::Format::Json {
        let json: serde_json::Value =
            serde_json::from_slice(body).map_err(BodyParseError::InvalidJson)?;
        return Ok(Some(tucana::shared::helper::value::from_json_value(json)));
    }

    let encoded = ENGINE
        .with(|engine| {
            engine.convert(
                body,
                format,
                lupus::Format::Protobuf,
                &lupus::DecodeContext,
                &lupus::EncodeContext::default(),
            )
        })
        .map_err(|err| BodyParseError::Conversion {
            content_type: content_type.unwrap_or("<missing>").to_string(),
            source: err,
        })?;

    let value = serde_json::from_slice(&encoded).map_err(BodyParseError::InvalidJson)?;
    Ok(Some(value))
}

pub fn encode_body(content_type: Option<&str>, value: Value) -> Result<Vec<u8>, BodyEncodeError> {
    let content_type = content_type.unwrap_or("application/json");
    let format = format_for_content_type(content_type)
        .map_err(|observed| BodyEncodeError::UnsupportedContentType { observed })?;

    if format == lupus::Format::Json {
        let json = tucana::shared::helper::value::to_json_value(value);
        return serde_json::to_vec(&json).map_err(BodyEncodeError::InvalidJson);
    }

    let protobuf = serde_json::to_vec(&value).map_err(BodyEncodeError::InvalidJson)?;
    ENGINE
        .with(|engine| {
            engine.convert(
                &protobuf,
                lupus::Format::Protobuf,
                format,
                &lupus::DecodeContext,
                &lupus::EncodeContext::default(),
            )
        })
        .map_err(|err| BodyEncodeError::Conversion {
            content_type: content_type.to_string(),
            source: err,
        })
}

/// The content-type -> lupus format mapping, shared by both directions. The
/// error is just the observed content type; each caller wraps it in its own
/// `UnsupportedContentType` variant.
fn format_for_content_type(content_type: &str) -> Result<lupus::Format, String> {
    let essence = content_type
        .split(';')
        .next()
        .unwrap_or(content_type)
        .trim()
        .to_ascii_lowercase();

    let format = match essence.as_str() {
        "application/json" | "text/json" => lupus::Format::Json,
        value if value.ends_with("+json") => lupus::Format::Json,
        "application/xhtml+xml" => lupus::Format::Html,
        "application/xml" | "text/xml" => lupus::Format::Xml,
        value if value.ends_with("+xml") => lupus::Format::Xml,
        "text/html" => lupus::Format::Html,
        "text/plain" => lupus::Format::Text,
        "text/csv" | "application/csv" => lupus::Format::Csv,
        "application/x-www-form-urlencoded" => lupus::Format::HttpForm,
        _ => return Err(content_type.to_string()),
    };
    Ok(format)
}

fn get_content_type(headers: &HeaderMap<HeaderValue>) -> Option<&str> {
    headers.get(CONTENT_TYPE).and_then(|h| h.to_str().ok())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tucana::shared::{NumberValue, Struct, number_value, value::Kind};

    /// Regression guard: the JSON fast path (`format == Json` short-circuit
    /// in `parse_body`/`encode_body`) must keep producing exactly what the
    /// generic `lupus::Engine` round trip it bypasses would have produced.
    fn generic_engine_parse(body: &[u8]) -> Value {
        let encoded = ENGINE
            .with(|engine| {
                engine.convert(
                    body,
                    lupus::Format::Json,
                    lupus::Format::Protobuf,
                    &lupus::DecodeContext,
                    &lupus::EncodeContext::default(),
                )
            })
            .unwrap();
        serde_json::from_slice(&encoded).unwrap()
    }

    fn generic_engine_encode(value: Value) -> Vec<u8> {
        let protobuf = serde_json::to_vec(&value).unwrap();
        ENGINE
            .with(|engine| {
                engine.convert(
                    &protobuf,
                    lupus::Format::Protobuf,
                    lupus::Format::Json,
                    &lupus::DecodeContext,
                    &lupus::EncodeContext::default(),
                )
            })
            .unwrap()
    }

    #[test]
    fn json_fast_path_parse_matches_generic_engine() {
        let body = br#"{"hello":"world","count":3,"tags":["a","b"],"nested":{"ok":true}}"#;
        let fast = parse_body(Some("application/json"), body).unwrap().unwrap();
        let generic = generic_engine_parse(body);
        assert_eq!(fast, generic);
    }

    #[test]
    fn json_fast_path_encode_matches_generic_engine() {
        let value = tucana::shared::helper::value::from_json_value(serde_json::json!({
            "hello": "world",
            "count": 3,
            "tags": ["a", "b"],
        }));
        let fast = encode_body(Some("application/json"), value.clone()).unwrap();
        let generic = generic_engine_encode(value);
        let fast_json: serde_json::Value = serde_json::from_slice(&fast).unwrap();
        let generic_json: serde_json::Value = serde_json::from_slice(&generic).unwrap();
        assert_eq!(fast_json, generic_json);
    }

    #[test]
    fn parse_json_body_to_struct_value() {
        let parsed = parse_body(Some("application/json"), br#"{"hello":"world"}"#).unwrap();
        let Some(Value {
            kind: Some(Kind::StructValue(Struct { fields })),
        }) = parsed
        else {
            panic!("expected struct value");
        };
        assert!(fields.contains_key("hello"));
    }

    #[test]
    fn parse_text_body_to_string_value() {
        let parsed = parse_body(Some("text/plain"), b"hello").unwrap();
        assert_eq!(
            parsed,
            Some(Value {
                kind: Some(Kind::StringValue("hello".to_string()))
            })
        );
    }

    #[test]
    fn parse_missing_content_type_falls_back_to_text() {
        let parsed = parse_body(None, b"hello").unwrap();
        assert_eq!(
            parsed,
            Some(Value {
                kind: Some(Kind::StringValue("hello".to_string()))
            })
        );
    }

    #[test]
    fn parse_xml_body_to_struct_value() {
        let parsed = parse_body(Some("application/xml"), b"<user>Ada</user>").unwrap();
        let Some(Value {
            kind: Some(Kind::StructValue(Struct { fields })),
        }) = parsed
        else {
            panic!("expected struct value");
        };
        assert_eq!(
            fields.get("user").and_then(|v| v.kind.as_ref()),
            Some(&Kind::StringValue("Ada".to_string()))
        );
    }

    #[test]
    fn parse_form_urlencoded_body_to_struct_value() {
        let parsed = parse_body(
            Some("application/x-www-form-urlencoded"),
            b"name=Ada+Doe&email=ada%40example.com",
        )
        .unwrap();
        let Some(Value {
            kind: Some(Kind::StructValue(Struct { fields })),
        }) = parsed
        else {
            panic!("expected struct value");
        };
        assert_eq!(
            fields.get("name").and_then(|v| v.kind.as_ref()),
            Some(&Kind::StringValue("Ada Doe".to_string()))
        );
        assert_eq!(
            fields.get("email").and_then(|v| v.kind.as_ref()),
            Some(&Kind::StringValue("ada@example.com".to_string()))
        );
    }

    #[test]
    fn parse_unsupported_content_type_fails() {
        let err = parse_body(Some("application/octet-stream"), b"\x00\x01").unwrap_err();
        assert!(matches!(err, BodyParseError::UnsupportedContentType { .. }));
    }

    #[test]
    fn encode_json_body_from_struct_value() {
        let value = Value {
            kind: Some(Kind::StructValue(Struct {
                fields: [(
                    "hello".to_string(),
                    Value {
                        kind: Some(Kind::StringValue("world".to_string())),
                    },
                )]
                .into_iter()
                .collect(),
            })),
        };

        let encoded = encode_body(Some("application/json"), value).unwrap();
        let parsed: serde_json::Value = serde_json::from_slice(&encoded).unwrap();
        assert_eq!(parsed["hello"], "world");
    }

    #[test]
    fn encode_text_body_from_number_value() {
        let value = Value {
            kind: Some(Kind::NumberValue(NumberValue {
                number: Some(number_value::Number::Integer(42)),
            })),
        };
        assert_eq!(
            encode_body(Some("text/plain"), value).unwrap(),
            b"42".to_vec()
        );
    }

    #[test]
    fn encode_body_converts_struct_to_xml() {
        let value = Value {
            kind: Some(Kind::StructValue(Struct {
                fields: [(
                    "user".to_string(),
                    Value {
                        kind: Some(Kind::StringValue("Ada".to_string())),
                    },
                )]
                .into_iter()
                .collect(),
            })),
        };
        assert_eq!(
            encode_body(Some("application/xml"), value).unwrap(),
            b"<user>Ada</user>".to_vec()
        );
    }

    #[test]
    fn encode_missing_content_type_falls_back_to_json() {
        let value = Value {
            kind: Some(Kind::StringValue("hello".to_string())),
        };
        assert_eq!(encode_body(None, value).unwrap(), b"\"hello\"".to_vec());
    }

    #[test]
    fn encode_unknown_content_type_fails() {
        let value = Value {
            kind: Some(Kind::StringValue("x".to_string())),
        };
        let err = encode_body(Some("application/octet-stream"), value).unwrap_err();
        assert!(matches!(
            err,
            BodyEncodeError::UnsupportedContentType { .. }
        ));
    }

    #[test]
    fn round_trips_csv_body_through_parse_and_encode() {
        let parsed = parse_body(Some("text/csv"), b"name,role\nTom,admin\nAda,user\n")
            .unwrap()
            .expect("non-empty body");

        let encoded = encode_body(Some("text/csv"), parsed).unwrap();
        assert_eq!(encoded, b"name,role\nTom,admin\nAda,user\n".to_vec());
    }
}
