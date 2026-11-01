//! Data types this action contributes to the module vocabulary.

use hercules_sdk::JsonSchema;
use russh_sftp::protocol::FileType;
use serde::{Deserialize, Serialize};

/// A single entry returned by `sftp::directory::list`.
#[hercules_sdk::data_type(
    identifier = "SFTP_ENTRY",
    name(en_US = "SFTP Entry"),
    display_message(en_US = "${name} (${kind})"),
    alias(en_US = "sftp;file;directory;entry;listing")
)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct SftpEntry {
    /// The entry's own name, without any leading directory component.
    pub name: String,
    /// The full remote path, i.e. the listed directory joined with `name`.
    pub path: String,
    /// Size in bytes (`0` for entries whose size the server didn't report).
    pub size: u64,
    /// One of `file`, `directory`, `symlink` or `other`.
    pub kind: String,
}

impl SftpEntry {
    pub fn new(name: String, path: String, size: u64, file_type: FileType) -> Self {
        Self {
            name,
            path,
            size,
            kind: kind_label(file_type).to_string(),
        }
    }
}

/// The stable, platform-facing label for an SFTP file type. Kept separate from
/// `russh_sftp`'s `FileType` so the strings a flow sees don't change if the
/// underlying crate renames its variants.
fn kind_label(file_type: FileType) -> &'static str {
    match file_type {
        FileType::Dir => "directory",
        FileType::File => "file",
        FileType::Symlink => "symlink",
        FileType::Other => "other",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn maps_every_file_type_to_its_label() {
        assert_eq!(kind_label(FileType::Dir), "directory");
        assert_eq!(kind_label(FileType::File), "file");
        assert_eq!(kind_label(FileType::Symlink), "symlink");
        assert_eq!(kind_label(FileType::Other), "other");
    }

    #[test]
    fn serializes_to_the_expected_shape() {
        let entry = SftpEntry::new(
            "report.csv".to_string(),
            "/out/report.csv".to_string(),
            1024,
            FileType::File,
        );
        assert_eq!(
            serde_json::to_value(&entry).unwrap(),
            json!({
                "name": "report.csv",
                "path": "/out/report.csv",
                "size": 1024,
                "kind": "file",
            })
        );
    }
}
