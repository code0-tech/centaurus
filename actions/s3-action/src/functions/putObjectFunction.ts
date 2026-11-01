import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { File } from "@code0-tech/hercules";
import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { getS3Client, resolveBucket, toRuntimeError } from "../helpers.js";
import { S3Object, S3ObjectSchema } from "../data_types/s3Object.js";

@Identifier("putObject")
@DisplayIcon("simple:amazons3")
@Signature("(Key: string, File: FILE, Bucket?: string): S3_OBJECT")
@Name({ code: "en-US", content: "Upload object" })
@DisplayMessage({ code: "en-US", content: "Upload object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads an object to S3 (or an S3-compatible provider), creating it or overwriting an existing object with the same key. `File` is a standard FILE value (base64-encoded content plus an optional content type).",
})
@Description({
    code: "en-US",
    content: "Uploads an object to S3.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to write to within the bucket." }],
})
@Parameter({
    runtimeName: "File",
    name: [{ code: "en-US", content: "File" }],
    description: [{ code: "en-US", content: "The file content to upload, as a standard FILE value." }],
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to upload to. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class PutObjectFunction {
    async run(context: FunctionContext, Key: string, File: File, Bucket?: string): Promise<S3Object> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);
        const body = Buffer.from(File.value, "base64");
        // `File.contentType` is generic/unknown at the schema level (hercules'
        // FILE value doesn't parameterize it), but it's a string at runtime.
        const contentType = typeof File.contentType === "string" ? File.contentType : undefined;

        try {
            const result = await client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key,
                    Body: body,
                    ...(contentType ? { ContentType: contentType } : {}),
                })
            );

            return S3ObjectSchema.parse({
                Key,
                Bucket: bucket,
                ETag: result.ETag,
                Location: `${bucket}/${Key}`,
                VersionId: result.VersionId,
            });
        } catch (error) {
            throw toRuntimeError("S3_PUT_OBJECT_FAILED", error);
        }
    }
}
