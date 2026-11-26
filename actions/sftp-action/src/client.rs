//! Opens an SSH connection, starts its SFTP subsystem, and exposes the file
//! operations the runtime functions need.
//!
//! Each call constructs a fresh [`SftpConnection`] — connecting is cheap
//! relative to a flow execution, and a stateless connection-per-call keeps the
//! action free of shared mutable session state (important since every instance
//! handles every flow; see [`crate::build_action`]'s scaling choice).

use std::sync::Arc;

use russh::client::{self, Handle};
use russh::keys::PublicKeyOrCertificate;
use russh_sftp::client::SftpSession;

use crate::config::SftpConfig;
use crate::data_types::SftpEntry;

/// russh event handler.
///
/// SFTP actions connect to whichever server the user configured, so there's no
/// known-hosts list to pin the presented key against — we accept it and log the
/// key so an operator can still audit what was connected to. Host-key pinning
/// would be the natural next step if the platform grows somewhere to store the
/// expected fingerprint.
struct Client;

impl client::Handler for Client {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        server_public_key: &PublicKeyOrCertificate,
    ) -> Result<bool, Self::Error> {
        log::warn!("accepting SFTP host key without verification: {server_public_key:?}");
        Ok(true)
    }
}

/// A live SFTP session together with the SSH connection backing it. Both are
/// held together because dropping the [`Handle`] tears down the transport the
/// [`SftpSession`] reads and writes over.
pub struct SftpConnection {
    sftp: SftpSession,
    _session: Handle<Client>,
}

impl SftpConnection {
    /// Connects to the configured server, authenticates with a password, and
    /// starts the SFTP subsystem.
    pub async fn connect(config: &SftpConfig) -> Result<Self, Error> {
        let ssh_config = Arc::new(client::Config::default());
        let mut session =
            client::connect(ssh_config, (config.host.as_str(), config.port), Client).await?;

        let authenticated = session
            .authenticate_password(&config.username, &config.password)
            .await?;
        if !authenticated.success() {
            return Err(Error::Auth);
        }

        let channel = session.channel_open_session().await?;
        channel.request_subsystem(true, "sftp").await?;
        let sftp = SftpSession::new(channel.into_stream()).await?;

        Ok(Self {
            sftp,
            _session: session,
        })
    }

    /// Reads a remote file in full.
    pub async fn read(&self, path: &str) -> Result<Vec<u8>, Error> {
        Ok(self.sftp.read(path).await?)
    }

    /// Writes `data` to a remote file, creating or truncating it.
    pub async fn write(&self, path: &str, data: &[u8]) -> Result<(), Error> {
        Ok(self.sftp.write(path, data).await?)
    }

    /// Removes a remote file.
    pub async fn remove(&self, path: &str) -> Result<(), Error> {
        Ok(self.sftp.remove_file(path).await?)
    }

    /// Lists the entries of a remote directory (excluding `.` and `..`, which
    /// `read_dir` already filters out).
    pub async fn list(&self, path: &str) -> Result<Vec<SftpEntry>, Error> {
        let entries = self
            .sftp
            .read_dir(path)
            .await?
            .map(|entry| {
                SftpEntry::new(
                    entry.file_name(),
                    entry.path(),
                    entry.metadata().len(),
                    entry.file_type(),
                )
            })
            .collect();
        Ok(entries)
    }
}

/// Anything that can go wrong talking to the SFTP server.
#[derive(Debug)]
pub enum Error {
    /// The SSH transport failed (connect, key exchange, channel setup).
    Ssh(russh::Error),
    /// The SFTP subsystem returned an error (e.g. no such file, permission
    /// denied).
    Sftp(russh_sftp::client::error::Error),
    /// The server rejected the supplied credentials.
    Auth,
}

impl Error {
    /// A stable, machine-readable code surfaced to the flow as the runtime
    /// error code, so a flow can branch on the failure class.
    pub fn code(&self) -> &'static str {
        match self {
            Error::Ssh(_) => "SFTP_SSH_ERROR",
            Error::Sftp(_) => "SFTP_PROTOCOL_ERROR",
            Error::Auth => "SFTP_AUTH_FAILED",
        }
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Ssh(err) => write!(f, "SSH transport error: {err}"),
            Error::Sftp(err) => write!(f, "SFTP error: {err}"),
            Error::Auth => write!(
                f,
                "authentication failed: the server rejected the credentials"
            ),
        }
    }
}

impl std::error::Error for Error {}

impl From<russh::Error> for Error {
    fn from(err: russh::Error) -> Self {
        Error::Ssh(err)
    }
}

impl From<russh_sftp::client::error::Error> for Error {
    fn from(err: russh_sftp::client::error::Error) -> Self {
        Error::Sftp(err)
    }
}
