import { S3Client } from "@aws-sdk/client-s3";
import { FunctionContext, RuntimeError } from "@code0-tech/hercules";

/**
 * Builds (and caches) an S3 client from the action configuration.
 *
 * The client is cached per (accessKeyId, region, endpoint) combination so
 * repeated function invocations reuse the same instance and connection pool.
 * Uses the official `@aws-sdk/client-s3`, which works against AWS S3 and any
 * S3-compatible provider (MinIO, Cloudflare R2, DigitalOcean Spaces, ...) by
 * pointing `endpoint` at that provider.
 */
let cached: { accessKeyId: string; region: string; endpoint: string; client: S3Client } | null = null;

export function getS3Client(context: FunctionContext): S3Client {
    const accessKeyId = context.matchedConfig.findConfig("access_key_id") as string;
    const secretAccessKey = context.matchedConfig.findConfig("secret_access_key") as string;

    if (!accessKeyId || !secretAccessKey) {
        throw new RuntimeError(
            "S3_MISSING_CREDENTIALS",
            "No S3 credentials configured. Set the 'access_key_id' and 'secret_access_key' configs."
        );
    }

    const region = (context.matchedConfig.findConfig("region") as string) || "us-east-1";
    const endpoint = (context.matchedConfig.findConfig("endpoint") as string) || "";

    if (cached && cached.accessKeyId === accessKeyId && cached.region === region && cached.endpoint === endpoint) {
        return cached.client;
    }

    const client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
        // A custom endpoint is only set for S3-compatible providers (MinIO,
        // R2, Spaces, ...), which virtually always require path-style
        // addressing. Real AWS S3 keeps using virtual-hosted-style requests.
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
    cached = { accessKeyId, region, endpoint, client };
    return client;
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
 * Maps an error thrown by the AWS SDK (or anything else) into a Hercules
 * RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the S3 API.");
}
