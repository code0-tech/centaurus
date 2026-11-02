# S3 Action

S3 / object storage integration for the **Hercules** automation platform.

Works against AWS S3 and any S3-compatible provider (MinIO, Cloudflare R2,
DigitalOcean Spaces, ...) by pointing the `endpoint` config at that provider.

## Functions

The action exposes two parallel function sets. The **object** set is the
S3-native primitive: you give an explicit key and exchange the body as raw
(UTF-8 text) data. The **file** set works with hercules' standard `FILE` value
(base64 content plus a file name/content type), deriving object keys from the
file name — so a file downloaded from S3 can be piped directly into, say, an
HTTP upload, and vice versa. Pick the set that matches the data you have.

### Object functions (raw data, explicit key)

| Function | Description |
|----------|-------------|
| `uploadObject` | Upload raw text `Data` to an explicit `Key`, creating or overwriting the object. |
| `downloadObject` | Download an object's body as raw UTF-8 text, plus metadata. |
| `deleteObject` | Delete an object. |
| `listObjects` | List objects in a bucket, optionally filtered by prefix. |
| `createObjectPresignedUrl` | Generate a temporary signed URL for direct GET or PUT access. |

### File functions (hercules `FILE` values)

| Function | Description |
|----------|-------------|
| `uploadFiles` | Upload one or more `FILE` values, creating or overwriting them. Each file's key is its own name, optionally under a `KeyPrefix`. |
| `downloadFile` | Download an object's content as a `FILE` value (base64), plus metadata. |
| `deleteFile` | Delete a file. |
| `listFiles` | List files in a bucket, optionally filtered by prefix. |
| `createFilePresignedUrl` | Generate a temporary signed URL for direct GET or PUT access. |

## Configuration

| Config | Required | Description |
|--------|----------|-------------|
| `access_key_id` | no | Access key ID. Leave empty to fall back to the AWS SDK's default credential provider chain (env vars, shared config file, or an IAM role). |
| `secret_access_key` | no | Secret access key. Leave empty for the same default credential provider chain fallback. |
| `region` | no | Region to connect to. Defaults to `us-east-1`. |
| `endpoint` | no | Custom endpoint URL for S3-compatible providers. Empty uses AWS S3. |
| `bucket` | no | Default bucket used when a function call does not specify one. |

Leaving both `access_key_id` and `secret_access_key` empty is the expected
setup when this action runs inside AWS (EC2/ECS/EKS) with an IAM role, rather
than a static key pair.

When `endpoint` is set, requests use path-style addressing (required by most
S3-compatible providers); AWS S3 keeps using virtual-hosted-style requests.

All API calls use the official
[`@aws-sdk/client-s3`](https://www.npmjs.com/package/@aws-sdk/client-s3) and
[`@aws-sdk/s3-request-presigner`](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner)
packages.

## Data types

The `@Schema` data types are manually defined zod schemas covering the fields
each function needs — there is no vendor OpenAPI spec for the S3 API to
generate from. `S3_OBJECT_CONTENT`'s `File` field reuses hercules' built-in
`fileSchema`/`FILE` data type rather than inventing a bespoke one.
