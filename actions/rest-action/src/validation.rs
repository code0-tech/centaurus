//! Validates a request body against a flow's `input_schema` setting (a JSON
//! Schema stored as a `shared.Struct`). Ported from draco's REST adapter
//! unchanged.

use lupus::data::{Data, Number};
use std::collections::BTreeMap;
use tucana::shared::{Struct, Value, helper::value::to_json_value, value::Kind};

#[derive(Debug)]
pub enum BodyValidationError {
    InvalidSchema(String),
    InvalidBody(String),
    Validation(String),
}

impl std::fmt::Display for BodyValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidSchema(msg) => write!(f, "flow input schema is invalid: {}", msg),
            Self::InvalidBody(msg) => write!(f, "request body could not be validated: {}", msg),
            Self::Validation(msg) => write!(f, "request body failed schema validation: {}", msg),
        }
    }
}

impl std::error::Error for BodyValidationError {}

/// A flow without an `input_schema` (or with an empty one) accepts any body
/// unvalidated.
pub fn validate_body_against_schema(
    input_schema: Option<&Struct>,
    body: Option<&Value>,
) -> Result<(), BodyValidationError> {
    let Some(input_schema) = input_schema.filter(|schema| !schema.fields.is_empty()) else {
        return Ok(());
    };

    let schema_json = to_json_value(Value {
        kind: Some(Kind::StructValue(input_schema.clone())),
    });
    let raw = serde_json::to_string(&schema_json)
        .map_err(|err| BodyValidationError::InvalidSchema(err.to_string()))?;
    let schema = lupus::JsonSchema { raw };

    let body_value = body.cloned().unwrap_or(Value {
        kind: Some(Kind::NullValue(0)),
    });
    let data = json_value_to_data(to_json_value(body_value))?;

    lupus::validation::validate_json_schema(&data, &schema)
        .map_err(|err| BodyValidationError::Validation(err.to_string()))
}

/// Mirrors lupus's internal JSON-to-`Data` conversion; can't reuse
/// `lupus::formats::json` directly since the `tucana::shared::Value` type
/// here and the one `lupus` depends on resolve to different (semver
/// incompatible 0.0.x) versions of `tucana`.
fn json_value_to_data(value: serde_json::Value) -> Result<Data, BodyValidationError> {
    match value {
        serde_json::Value::Null => Ok(Data::Null),
        serde_json::Value::Bool(value) => Ok(Data::Bool(value)),
        serde_json::Value::Number(value) => {
            if let Some(value) = value.as_i64() {
                Ok(Data::Number(Number::I64(value)))
            } else if let Some(value) = value.as_u64() {
                Ok(Data::Number(Number::U64(value)))
            } else if let Some(value) = value.as_f64() {
                Ok(Data::Number(Number::F64(value)))
            } else {
                Err(BodyValidationError::InvalidBody(
                    "unsupported JSON number".to_string(),
                ))
            }
        }
        serde_json::Value::String(value) => Ok(Data::String(value)),
        serde_json::Value::Array(values) => values
            .into_iter()
            .map(json_value_to_data)
            .collect::<Result<Vec<_>, _>>()
            .map(Data::Array),
        serde_json::Value::Object(fields) => fields
            .into_iter()
            .map(|(key, value)| Ok((key, json_value_to_data(value)?)))
            .collect::<Result<BTreeMap<_, _>, _>>()
            .map(Data::Object),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn schema_struct(raw_schema: serde_json::Value) -> Struct {
        let Value {
            kind: Some(Kind::StructValue(schema)),
        } = tucana::shared::helper::value::from_json_value(raw_schema)
        else {
            panic!("expected object schema");
        };
        schema
    }

    #[test]
    fn missing_schema_allows_any_body() {
        let body = Value {
            kind: Some(Kind::StringValue("anything".to_string())),
        };
        assert!(validate_body_against_schema(None, Some(&body)).is_ok());
    }

    #[test]
    fn empty_schema_allows_any_body() {
        let schema = Struct {
            fields: HashMap::new(),
        };
        let body = Value {
            kind: Some(Kind::StringValue("anything".to_string())),
        };
        assert!(validate_body_against_schema(Some(&schema), Some(&body)).is_ok());
    }

    #[test]
    fn matching_body_passes_validation() {
        let schema = schema_struct(serde_json::json!({
            "type": "object",
            "required": ["name"],
            "properties": { "name": { "type": "string" } }
        }));
        let body =
            tucana::shared::helper::value::from_json_value(serde_json::json!({ "name": "Ada" }));
        assert!(validate_body_against_schema(Some(&schema), Some(&body)).is_ok());
    }

    #[test]
    fn mismatched_body_fails_validation() {
        let schema = schema_struct(serde_json::json!({
            "type": "object",
            "required": ["name"],
            "properties": { "name": { "type": "string" } }
        }));
        let body = tucana::shared::helper::value::from_json_value(serde_json::json!({ "age": 42 }));
        let err = validate_body_against_schema(Some(&schema), Some(&body)).unwrap_err();
        assert!(matches!(err, BodyValidationError::Validation(_)));
    }
}
