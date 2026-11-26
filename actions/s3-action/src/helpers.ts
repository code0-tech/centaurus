import { S3Client } from "@aws-sdk/client-s3";
import { FunctionContext, RuntimeError } from "@code0-tech/hercules";

/**
 * Builds an S3 client from the action configuration.
 *
 * A fresh client is built per call: a single action process serves many flows,
 * each with its own matched config (different credentials, region or endpoint),
 * so there is no single client that can be safely reused across invocations.
 * Uses the official `@aws-sdk/client-s3`, which works against AWS S3 and any
 * S3-compatible provider (MinIO, Cloudflare R2, DigitalOcean Spaces, ...) by
 * pointing `endpoint` at that provider.
 *
 * access_key_id / secret_access_key are optional: when either is left
 * unconfigured, the AWS SDK's default credential provider chain is used
 * instead (environment variables, shared config/credentials file, or an
 * IAM role), which is the common setup when this action runs inside AWS
 * (EC2/ECS/EKS) rather than with a static key pair.
 */
export function getS3Client(context: FunctionContext): S3Client {
    const accessKeyId = (context.matchedConfig.findConfig("access_key_id") as string) || "";
    const secretAccessKey = (context.matchedConfig.findConfig("secret_access_key") as string) || "";
    const region = (context.matchedConfig.findConfig("region") as string) || "us-east-1";
    const endpoint = (context.matchedConfig.findConfig("endpoint") as string) || "";

    return new S3Client({
        region,
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
        // A custom endpoint is only set for S3-compatible providers (MinIO,
        // R2, Spaces, ...), which virtually always require path-style
        // addressing. Real AWS S3 keeps using virtual-hosted-style requests.
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
}

/**
 * Resolves the bucket to operate on: an explicit per-call override, falling
 * back to the action's configured default bucket.
 */
export function resolveBucket(context: FunctionContext, bucket?: string): string {
    const resolved = bucket || (context.matchedConfig.findConfig("bucket") as string) || "";
    if (!resolved) {
        throw new RuntimeError(
            "S3_MISSING_BUCKET",
            "No bucket provided. Pass a Bucket value or configure a default 'bucket' for the action."
        );
    }
    return resolved;
}

/**
 * Builds the object key for an uploaded file. The key is the file's own
 * `fileName` (the FILE value always carries one), optionally placed under a
 * key prefix so several files can be uploaded into the same "folder". The
 * prefix and file name are joined with a single `/` unless the prefix is empty
 * or already ends with one.
 */
export function resolveObjectKey(fileName: string, prefix?: string): string {
    const name = fileName || "";
    if (!name) {
        throw new RuntimeError(
            "S3_MISSING_FILE_NAME",
            "A file to upload is missing its file name; cannot derive an object key for it."
        );
    }
    const normalizedPrefix = prefix || "";
    if (!normalizedPrefix) {
        return name;
    }
    return normalizedPrefix.endsWith("/") ? `${normalizedPrefix}${name}` : `${normalizedPrefix}/${name}`;
}

/**
 * Maps an error thrown by the AWS SDK (or anything else) into a Hercules
 * RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the S3 API.");
}
