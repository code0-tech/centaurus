import { describe, expect, it } from "vitest";
import { S3ObjectSchema } from "../src/data_types/s3Object.js";
import { S3ObjectListSchema } from "../src/data_types/s3ObjectList.js";
import { S3DeleteResultSchema } from "../src/data_types/s3DeleteResult.js";

describe("S3ObjectSchema", () => {
    it("parses an upload result", () => {
        const parsed = S3ObjectSchema.parse({
            bucket: "my-bucket",
            key: "folder/file.txt",
            etag: '"d41d8cd98f00b204e9800998ecf8427e"',
            versionId: null,
            contentType: "text/plain",
            contentLength: 11,
            lastModified: null,
            file: null,
        });
        expect(parsed.bucket).toEqual("my-bucket");
        expect(parsed.key).toEqual("folder/file.txt");
    });

    it("parses a download result with a base64 FILE value", () => {
        const parsed = S3ObjectSchema.parse({
            bucket: "my-bucket",
            key: "folder/file.txt",
            file: {
                contentType: "text/plain",
                valueType: "base64",
                value: Buffer.from("hello world").toString("base64"),
            },
        });
        expect(Buffer.from(parsed.file?.value ?? "", "base64").toString("utf-8")).toEqual("hello world");
    });
});

describe("S3ObjectListSchema", () => {
    it("parses a list result", () => {
        const parsed = S3ObjectListSchema.parse({
            bucket: "my-bucket",
            prefix: "folder/",
            isTruncated: false,
            objects: [{ key: "folder/a.txt", size: 5 }],
        });
        expect(parsed.objects).toHaveLength(1);
        expect(parsed.objects[0].key).toEqual("folder/a.txt");
    });
});

describe("S3DeleteResultSchema", () => {
    it("parses a delete result", () => {
        const parsed = S3DeleteResultSchema.parse({
            bucket: "my-bucket",
            key: "folder/file.txt",
            deleted: true,
        });
        expect(parsed.deleted).toBe(true);
    });
});
