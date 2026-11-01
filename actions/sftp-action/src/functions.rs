//! The `sftp::*` functions a flow calls to operate on the remote server.
//!
//! Every handler follows the same shape: resolve the connection details from
//! the project configuration, open a fresh [`SftpConnection`], run one
//! operation, and map any failure to a [`HerculesError::Runtime`] carrying a
//! stable code (see [`crate::client::Error::code`]) so flows can branch on it.

use hercules_sdk::{
    Arguments, FunctionContext, HerculesError, PlainValue, Result, RuntimeFunctionHandler,
    async_trait,
};

use crate::client::SftpConnection;
use crate::config::SftpConfig;

/// Resolves the configured connection details and opens a session, turning
/// both the config and connection failures into runtime errors.
async fn connect(context: &FunctionContext) -> Result<SftpConnection> {
    let config = SftpConfig::from_config(&context.matched_config)
        .map_err(|err| HerculesError::runtime("SFTP_CONFIG_ERROR", err.to_string()))?;
    SftpConnection::connect(&config)
        .await
        .map_err(|err| HerculesError::runtime(err.code(), err.to_string()))
}

/// Maps an operation failure to a runtime error with its stable code.
fn op_error(err: crate::client::Error) -> HerculesError {
    HerculesError::runtime(err.code(), err.to_string())
}

#[hercules_sdk::runtime_function(
    identifier = "sftp::file::read",
    signature = "(path: TEXT): TEXT",
    name(en_US = "Read File"),
    description(
        en_US = "Reads a file from the SFTP server and returns its contents as UTF-8 text. Fails if the file does not exist or is not valid UTF-8."
    ),
    display_message(en_US = "Reads the file ${path} from the SFTP server"),
    alias(en_US = "sftp;file;read;download;get;fetch"),
    display_icon = "tabler:file-download"
)]
#[parameter(
    runtime_name = "path",
    name(en_US = "Path"),
    description(en_US = "Absolute or relative path of the remote file to read.")
)]
pub struct ReadFile;

#[async_trait]
impl RuntimeFunctionHandler for ReadFile {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let path: String = args.get("path")?;
        log::info!("reading {path:?}");

        let bytes = connect(context)
            .await?
            .read(&path)
            .await
            .map_err(op_error)?;
        let text = String::from_utf8(bytes).map_err(|_| {
            HerculesError::runtime(
                "SFTP_NOT_UTF8",
                format!("file {path:?} is not valid UTF-8 text"),
            )
        })?;

        Ok(PlainValue::String(text))
    }
}

#[hercules_sdk::runtime_function(
    identifier = "sftp::file::write",
    signature = "(path: TEXT, content: TEXT): void",
    name(en_US = "Write File"),
    description(
        en_US = "Writes UTF-8 text to a file on the SFTP server, creating the file or overwriting it if it already exists."
    ),
    display_message(en_US = "Writes to the file ${path} on the SFTP server"),
    alias(en_US = "sftp;file;write;upload;put;save"),
    display_icon = "tabler:file-upload"
)]
#[parameter(
    runtime_name = "path",
    name(en_US = "Path"),
    description(en_US = "Absolute or relative path of the remote file to write.")
)]
#[parameter(
    runtime_name = "content",
    name(en_US = "Content"),
    description(en_US = "The UTF-8 text content to write to the file.")
)]
pub struct WriteFile;

#[async_trait]
impl RuntimeFunctionHandler for WriteFile {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let path: String = args.get("path")?;
        let content: String = args.get("content")?;
        log::info!("writing {} byte(s) to {path:?}", content.len());

        connect(context)
            .await?
            .write(&path, content.as_bytes())
            .await
            .map_err(op_error)?;

        Ok(PlainValue::Null)
    }
}

#[hercules_sdk::runtime_function(
    identifier = "sftp::file::delete",
    signature = "(path: TEXT): void",
    name(en_US = "Delete File"),
    description(
        en_US = "Deletes a file on the SFTP server. Fails if the file does not exist or cannot be removed."
    ),
    display_message(en_US = "Deletes the file ${path} on the SFTP server"),
    alias(en_US = "sftp;file;delete;remove;rm;unlink"),
    display_icon = "tabler:file-x"
)]
#[parameter(
    runtime_name = "path",
    name(en_US = "Path"),
    description(en_US = "Absolute or relative path of the remote file to delete.")
)]
pub struct DeleteFile;

#[async_trait]
impl RuntimeFunctionHandler for DeleteFile {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let path: String = args.get("path")?;
        log::info!("deleting {path:?}");

        connect(context)
            .await?
            .remove(&path)
            .await
            .map_err(op_error)?;

        Ok(PlainValue::Null)
    }
}

#[hercules_sdk::runtime_function(
    identifier = "sftp::directory::list",
    signature = "(path: TEXT): ARRAY<SFTP_ENTRY>",
    name(en_US = "List Directory"),
    description(
        en_US = "Lists the entries of a directory on the SFTP server. The `.` and `..` entries are omitted."
    ),
    display_message(en_US = "Lists the directory ${path} on the SFTP server"),
    alias(en_US = "sftp;directory;list;ls;dir;files"),
    display_icon = "tabler:folder-search",
    linked_data_type_identifiers("SFTP_ENTRY")
)]
#[parameter(
    runtime_name = "path",
    name(en_US = "Path"),
    description(en_US = "Absolute or relative path of the remote directory to list.")
)]
pub struct ListDirectory;

#[async_trait]
impl RuntimeFunctionHandler for ListDirectory {
    async fn run(&self, context: &FunctionContext, args: &Arguments) -> Result<PlainValue> {
        let path: String = args.get("path")?;
        log::info!("listing {path:?}");

        let entries = connect(context)
            .await?
            .list(&path)
            .await
            .map_err(op_error)?;

        Ok(serde_json::to_value(entries)?)
    }
}
