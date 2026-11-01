import "reflect-metadata";
import { describe, expect, it } from "vitest";
import type { FunctionContext } from "@code0-tech/hercules";
import { RuntimeError } from "@code0-tech/hercules";
import { S3ObjectSchema } from "../src/data_types/s3Object.js";
import { S3ObjectContentSchema } from "../src/data_types/s3ObjectContent.js";
import { S3DeleteResultSchema } from "../src/data_types/s3DeleteResult.js";
import { S3ObjectListSchema } from "../src/data_types/s3ObjectList.js";
import { S3PresignedUrlSchema } from "../src/data_types/s3PresignedUrl.js";
import { getS3Client, resolveBucket } from "../src/helpers.js";

function makeContext(configValues: Record<string, unknown>): FunctionContext {
    return {
        projectId: 1,
        executionId: "test-execution",
        matchedConfig: {
            projectId: 1,
            configValues: Object.entries(configValues).map(([identifier, value]) => ({ identifier, value: value as any })),
            findConfig: (identifier: string) => configValues[identifier] as any,
        },
        executeFlow: async () => null,
    };
}

describe("S3ObjectSchema", () => {
    it("parses a representative put-object result", () => {
        const parsed = S3ObjectSchema.parse({
            Key: "reports/2026-11-01.json",
            Bucket: "my-bucket",
            ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
            Location: "my-bucket/reports/2026-11-01.json",
        });
        expect(parsed.Key).toEqual("reports/2026-11-01.json");
    });
});

describe("S3ObjectContentSchema", () => {
    it("parses a representative get-object result with a base64 FILE value", () => {
        const parsed = S3ObjectContentSchema.parse({
            Key: "reports/2026-11-01.json",
            Bucket: "my-bucket",
            File: {
                contentType: "application/json",
                fileName: "2026-11-01.json",
                valueType: "base64",
                value: Buffer.from('{"status":"ok"}').toString("base64"),
            },
            ContentLength: 16,
        });
        expect(Buffer.from(parsed.File.value, "base64").toString("utf-8")).toEqual('{"status":"ok"}');
    });
});

describe("S3DeleteResultSchema", () => {
    it("parses a representative delete result", () => {
        const parsed = S3DeleteResultSchema.parse({ Key: "obsolete.txt", Bucket: "my-bucket", Deleted: true });
        expect(parsed.Bucket).toEqual("my-bucket");
        expect(parsed.Deleted).toBe(true);
    });
});

describe("S3ObjectListSchema", () => {
    it("parses a representative list-objects result", () => {
        const parsed = S3ObjectListSchema.parse({
            Bucket: "my-bucket",
            Prefix: "reports/",
            Objects: [{ Key: "reports/2026-11-01.json", Size: 16 }],
            IsTruncated: false,
        });
        expect(parsed.Objects).toHaveLength(1);
    });
});

describe("S3PresignedUrlSchema", () => {
    it("parses a representative presigned-url result", () => {
        const parsed = S3PresignedUrlSchema.parse({
            Url: "https://my-bucket.s3.amazonaws.com/key?X-Amz-Signature=...",
            Key: "reports/2026-11-01.json",
            Bucket: "my-bucket",
            Operation: "get",
            ExpiresInSeconds: 900,
        });
        expect(parsed.Operation).toEqual("get");
    });
});

describe("resolveBucket", () => {
    it("prefers an explicit bucket override", () => {
        const context = makeContext({ bucket: "default-bucket" });
        expect(resolveBucket(context, "override-bucket")).toEqual("override-bucket");
    });

    it("falls back to the configured default bucket", () => {
        const context = makeContext({ bucket: "default-bucket" });
        expect(resolveBucket(context)).toEqual("default-bucket");
    });

    it("throws when no bucket is available", () => {
        const context = makeContext({});
        expect(() => resolveBucket(context)).toThrow(RuntimeError);
    });
});

describe("getS3Client", () => {
    it("builds a client via the default credential provider chain when none are configured", () => {
        // access_key_id/secret_access_key are optional: with neither set, the
        // AWS SDK falls back to its default credential provider chain (env
        // vars, shared config, or an IAM role) instead of throwing.
        const context = makeContext({});
        expect(() => getS3Client(context)).not.toThrow();
    });

    it("builds a client when credentials are configured", () => {
        const context = makeContext({ access_key_id: "AKIA...", secret_access_key: "secret" });
        expect(() => getS3Client(context)).not.toThrow();
    });
});
