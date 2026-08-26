//! Validates a request body against a flow's `input_schema` setting (a JSON
//! Schema stored as a `shared.Struct`).
//!
//! Compiling a `jsonschema::Validator` is expensive (parses the schema
//! document and builds its own internal representation), so it happens once,
//! when a flow is upserted into the route registry (`registry.rs`), not on
//! every request. `validate` below only does the cheap part: converting the
//! already-parsed request body to `serde_json::Value` and running it through
//! an already-compiled validator.

use tucana::shared::{Struct, Value, helper::value::to_json_value, value::Kind};

#[derive(Debug)]
pub enum BodyValidationError {
    InvalidSchema(String),
    Validation(String),
}

impl std::fmt::Display for BodyValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidSchema(msg) => write!(f, "flow input schema is invalid: {}", msg),
            Self::Validation(msg) => write!(f, "request body failed schema validation: {}", msg),
        }
    }
}

impl std::error::Error for BodyValidationError {}

/// Compiles `input_schema` (a flow's `input_schema` setting) into a reusable
/// `jsonschema::Validator`. Called once per flow, at route-registry build
/// time — see `registry.rs`. A flow without an `input_schema` (or with an
/// empty one) accepts any body unvalidated, so its `CompiledRoute` simply
/// has no validator (`None`), and this function is never called for it.
pub fn compile_validator(
    input_schema: &Struct,
) -> Result<jsonschema::Validator, BodyValidationError> {
    let schema_json = to_json_value(Value {
        kind: Some(Kind::StructValue(input_schema.clone())),
    });
    jsonschema::options()
        .with_draft(jsonschema::Draft::Draft202012)
        .build(&schema_json)
        .map_err(|err| BodyValidationError::InvalidSchema(err.to_string()))
}

/// Validates `body` against an already-compiled validator. `validator ==
/// None` means the flow has no (or an empty) `input_schema`, so any body is
/// accepted.
pub fn validate_body_against_schema(
    validator: Option<&jsonschema::Validator>,
    body: Option<&Value>,
) -> Result<(), BodyValidationError> {
    let Some(validator) = validator else {
        return Ok(());
    };

    let body_value = body.cloned().unwrap_or(Value {
        kind: Some(Kind::NullValue(0)),
    });
    let instance = to_json_value(body_value);

    let errors: Vec<String> = validator
        .iter_errors(&instance)
        .map(|error| {
            let path = error.instance_path().to_string();
            if path.is_empty() {
                format!("at $: {error}")
            } else {
                format!("at ${path}: {error}")
            }
        })
        .collect();

    if errors.is_empty() {
        Ok(())
    } else {
        Err(BodyValidationError::Validation(errors.join("; ")))
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
        // An empty schema still compiles (matches anything), mirroring the
        // "no validator" case at the registry level, where an empty
        // `input_schema` is treated the same as a missing one and no
        // validator is compiled at all.
        let validator = compile_validator(&schema).unwrap();
        let body = Value {
            kind: Some(Kind::StringValue("anything".to_string())),
        };
        assert!(validate_body_against_schema(Some(&validator), Some(&body)).is_ok());
    }

    #[test]
    fn matching_body_passes_validation() {
        let schema = schema_struct(serde_json::json!({
            "type": "object",
            "required": ["name"],
            "properties": { "name": { "type": "string" } }
        }));
        let validator = compile_validator(&schema).unwrap();
        let body =
            tucana::shared::helper::value::from_json_value(serde_json::json!({ "name": "Ada" }));
        assert!(validate_body_against_schema(Some(&validator), Some(&body)).is_ok());
    }

    #[test]
    fn mismatched_body_fails_validation() {
        let schema = schema_struct(serde_json::json!({
            "type": "object",
            "required": ["name"],
            "properties": { "name": { "type": "string" } }
        }));
        let validator = compile_validator(&schema).unwrap();
        let body = tucana::shared::helper::value::from_json_value(serde_json::json!({ "age": 42 }));
        let err = validate_body_against_schema(Some(&validator), Some(&body)).unwrap_err();
        assert!(matches!(err, BodyValidationError::Validation(_)));
    }

    #[test]
    fn invalid_schema_document_fails_to_compile() {
        let schema = schema_struct(serde_json::json!({
            "type": "not-a-real-type"
        }));
        assert!(compile_validator(&schema).is_err());
    }
}
