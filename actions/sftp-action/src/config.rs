//! Connection details for the remote SFTP server.
//!
//! Credentials live in the project-level configuration (declared in
//! [`crate::build_action`]) rather than as per-call function parameters, so a
//! flow author never has to thread host/username/password through every
//! `sftp::*` call and secrets stay out of the flow definition. Each function
//! reads them back off the [`FunctionContext::matched_config`] it's handed at
//! execution time via [`SftpConfig::from_config`].

use hercules_sdk::ProjectConfiguration;

/// Configuration identifiers, declared once in [`crate::build_action`] and
/// read back here. Kept in one place so the two sides can't drift.
pub const HOST: &str = "SFTP_HOST";
pub const PORT: &str = "SFTP_PORT";
pub const USERNAME: &str = "SFTP_USERNAME";
pub const PASSWORD: &str = "SFTP_PASSWORD";

/// The default SSH/SFTP port, used when `SFTP_PORT` is left empty.
pub const DEFAULT_PORT: u16 = 22;

/// Resolved connection details for a single SFTP server.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SftpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

impl SftpConfig {
    /// Reads and validates the connection details out of a project's
    /// configuration.
    ///
    /// `SFTP_HOST` and `SFTP_USERNAME` are required and must be non-empty;
    /// `SFTP_PORT` defaults to [`DEFAULT_PORT`] when absent or empty and must
    /// otherwise parse as a `u16`; `SFTP_PASSWORD` defaults to empty (some
    /// servers accept an empty password, and publickey auth isn't wired up
    /// yet — see [`crate::client`]).
    pub fn from_config(config: &ProjectConfiguration) -> Result<Self, ConfigError> {
        let host = required(config, HOST)?;
        let username = required(config, USERNAME)?;
        let password = string(config, PASSWORD).unwrap_or_default();

        let port = match string(config, PORT) {
            Some(raw) => raw
                .parse()
                .map_err(|_| ConfigError::InvalidPort(raw.clone()))?,
            None => DEFAULT_PORT,
        };

        Ok(Self {
            host,
            port,
            username,
            password,
        })
    }
}

/// A configuration value that's missing, the wrong type, or otherwise unusable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigError {
    Missing(&'static str),
    InvalidPort(String),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::Missing(key) => {
                write!(
                    f,
                    "required configuration value {key:?} is missing or empty"
                )
            }
            ConfigError::InvalidPort(value) => {
                write!(
                    f,
                    "configuration value {PORT:?} is not a valid port: {value:?}"
                )
            }
        }
    }
}

impl std::error::Error for ConfigError {}

/// A non-empty string value for `key`, or `None` if it's absent, null, not a
/// string, or empty.
fn string(config: &ProjectConfiguration, key: &str) -> Option<String> {
    config
        .get(key)
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn required(config: &ProjectConfiguration, key: &'static str) -> Result<String, ConfigError> {
    string(config, key).ok_or(ConfigError::Missing(key))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn config(pairs: &[(&str, serde_json::Value)]) -> ProjectConfiguration {
        ProjectConfiguration {
            project_id: 1,
            config_values: pairs
                .iter()
                .map(|(k, v)| (k.to_string(), v.clone()))
                .collect(),
        }
    }

    #[test]
    fn reads_all_fields_and_parses_port() {
        let cfg = SftpConfig::from_config(&config(&[
            (HOST, json!("sftp.example.com")),
            (PORT, json!("2222")),
            (USERNAME, json!("alice")),
            (PASSWORD, json!("hunter2")),
        ]))
        .unwrap();

        assert_eq!(
            cfg,
            SftpConfig {
                host: "sftp.example.com".to_string(),
                port: 2222,
                username: "alice".to_string(),
                password: "hunter2".to_string(),
            }
        );
    }

    #[test]
    fn port_defaults_to_22_when_absent_or_empty() {
        let absent = SftpConfig::from_config(&config(&[
            (HOST, json!("h")),
            (USERNAME, json!("u")),
            (PASSWORD, json!("p")),
        ]))
        .unwrap();
        assert_eq!(absent.port, DEFAULT_PORT);

        let empty = SftpConfig::from_config(&config(&[
            (HOST, json!("h")),
            (PORT, json!("   ")),
            (USERNAME, json!("u")),
            (PASSWORD, json!("p")),
        ]))
        .unwrap();
        assert_eq!(empty.port, DEFAULT_PORT);
    }

    #[test]
    fn password_is_optional() {
        let cfg = SftpConfig::from_config(&config(&[(HOST, json!("h")), (USERNAME, json!("u"))]))
            .unwrap();
        assert_eq!(cfg.password, "");
    }

    #[test]
    fn host_and_username_are_required() {
        assert_eq!(
            SftpConfig::from_config(&config(&[(USERNAME, json!("u"))])),
            Err(ConfigError::Missing(HOST))
        );
        assert_eq!(
            SftpConfig::from_config(&config(&[(HOST, json!("h"))])),
            Err(ConfigError::Missing(USERNAME))
        );
        // An all-whitespace value is treated as empty, i.e. missing.
        assert_eq!(
            SftpConfig::from_config(&config(&[(HOST, json!("  ")), (USERNAME, json!("u"))])),
            Err(ConfigError::Missing(HOST))
        );
    }

    #[test]
    fn invalid_port_is_rejected() {
        assert_eq!(
            SftpConfig::from_config(&config(&[
                (HOST, json!("h")),
                (PORT, json!("not-a-port")),
                (USERNAME, json!("u")),
            ])),
            Err(ConfigError::InvalidPort("not-a-port".to_string()))
        );
        // Out of u16 range.
        assert_eq!(
            SftpConfig::from_config(&config(&[
                (HOST, json!("h")),
                (PORT, json!("70000")),
                (USERNAME, json!("u")),
            ])),
            Err(ConfigError::InvalidPort("70000".to_string()))
        );
    }
}
