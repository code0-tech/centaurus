# S3 Action

S3 / object storage integration for the **Hercules** automation platform.

Works against AWS S3 and any S3-compatible provider (MinIO, Cloudflare R2,
DigitalOcean Spaces, ...) by pointing the `endpoint` config at that provider.

## Functions

| Function | Description |
|----------|-------------|
| `putObject` | Upload an object, creating or overwriting it. |
| `getObject` | Download an object's content and metadata. |
| `deleteObject` | Delete an object. |
| `listObjects` | List objects in a bucket, optionally filtered by prefix. |
| `createPresignedUrl` | Generate a temporary signed URL for direct GET or PUT access. |

Object content is exchanged as hercules' standard `FILE` value (base64 content
plus an optional file name/content type), the same type other actions/functions
in a flow produce and consume — so a file downloaded from S3 can be piped
directly into, say, an HTTP upload, and vice versa.

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
