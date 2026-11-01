# S3 Action

S3 / object storage integration for the **Hercules** automation platform.

Works against AWS S3 and any S3-compatible provider (MinIO, Cloudflare R2,
DigitalOcean Spaces, ...) by pointing the `endpoint` config at that provider.

## Functions

| Function | Description |
|----------|-------------|
| `putObject` | Upload a UTF-8 text object, creating or overwriting it. |
| `getObject` | Download an object's content and metadata. |
| `deleteObject` | Delete an object. |
| `listObjects` | List objects in a bucket, optionally filtered by prefix. |
| `createPresignedUrl` | Generate a temporary signed URL for direct GET or PUT access. |

## Configuration

| Config | Required | Description |
|--------|----------|-------------|
| `access_key_id` | yes | Access key ID used to authenticate with the S3 API. |
| `secret_access_key` | yes | Secret access key used to authenticate with the S3 API. |
| `region` | no | Region to connect to. Defaults to `us-east-1`. |
| `endpoint` | no | Custom endpoint URL for S3-compatible providers. Empty uses AWS S3. |
| `bucket` | no | Default bucket used when a function call does not specify one. |

When `endpoint` is set, requests use path-style addressing (required by most
S3-compatible providers); AWS S3 keeps using virtual-hosted-style requests.

All API calls use the official
[`@aws-sdk/client-s3`](https://www.npmjs.com/package/@aws-sdk/client-s3) and
[`@aws-sdk/s3-request-presigner`](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner)
packages.

## Data types

Object content is handled as UTF-8 text (e.g. JSON, CSV, logs, HTML reports),
not arbitrary binary data. The `@Schema` data types are manually defined zod
schemas covering the fields each function needs — there is no vendor OpenAPI
spec for the S3 API to generate from.
