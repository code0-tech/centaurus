import { S3Client } from "@aws-sdk/client-s3";
import { FunctionContext, RuntimeError } from "@code0-tech/hercules";

/**
 * Builds (and caches) an S3 client from the action configuration.
 *
 * The client is cached per (access key, secret key, region, endpoint) tuple
 * so repeated function invocations reuse the same instance/connection pool
 * instead of re-authenticating on every call. Uses the official AWS SDK v3
 * `@aws-sdk/client-s3` package.
 */
let cached: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint: string;
    client: S3Client;
} | null = null;

/**
 * access_key_id / secret_access_key are optional: when either is left
 * unconfigured, the AWS SDK's default credential provider chain is used
 * instead (environment variables, shared config/credentials file, or an
 * IAM role) rather than a static key pair.
 */
export function getCredentials(context: FunctionContext): {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint: string;
} {
    const accessKeyId = (context.matchedConfig.findConfig("access_key_id") as string) || "";
    const secretAccessKey = (context.matchedConfig.findConfig("secret_access_key") as string) || "";
    const region = (context.matchedConfig.findConfig("region") as string) || "us-east-1";
    const endpoint = (context.matchedConfig.findConfig("endpoint") as string) || "";

    return { accessKeyId, secretAccessKey, region, endpoint };
}

export function getS3Client(context: FunctionContext): S3Client {
    const { accessKeyId, secretAccessKey, region, endpoint } = getCredentials(context);

    if (
        cached &&
        cached.accessKeyId === accessKeyId &&
        cached.secretAccessKey === secretAccessKey &&
        cached.region === region &&
        cached.endpoint === endpoint
    ) {
        return cached.client;
    }

    const client = new S3Client({
        region,
        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });

    cached = { accessKeyId, secretAccessKey, region, endpoint, client };
    return client;
}

/**
 * Resolves the bucket to operate on: an explicit per-call value takes
 * precedence, falling back to the action's configured default_bucket.
 */
export function getBucket(context: FunctionContext, bucketOverride?: string): string {
    const bucket = bucketOverride || ((context.matchedConfig.findConfig("default_bucket") as string) ?? "");

    if (!bucket) {
        throw new RuntimeError(
            "MISSING_S3_BUCKET",
            "No bucket provided. Pass a Bucket value or configure a default_bucket for the action."
        );
    }

    return bucket;
}

/**
 * Maps an error thrown by the AWS SDK (or anything else) into a Hercules
 * RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown, fallbackMessage: string): RuntimeError {
    if (error instanceof RuntimeError) {
        return error;
    }
    if (error instanceof Error) {
        console.error(`S3 API error [${code}]:`, error.message);
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, fallbackMessage);
}

/**
 * Consumes a Node/web readable stream body (as returned by GetObjectCommand)
 * into a single Buffer.
 */
export async function streamToBuffer(body: unknown): Promise<Buffer> {
    if (!body) {
        return Buffer.alloc(0);
    }
    // AsyncIterable (Node.js Readable) - the common case in the Node runtime.
    if (Symbol.asyncIterator in Object(body)) {
        const chunks: Buffer[] = [];
        for await (const chunk of body as AsyncIterable<Uint8Array>) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    // Web ReadableStream fallback.
    if (typeof (body as any).transformToByteArray === "function") {
        const bytes = await (body as any).transformToByteArray();
        return Buffer.from(bytes);
    }
    throw new RuntimeError("UNSUPPORTED_S3_BODY_STREAM", "Unable to read the S3 object body stream.");
}
