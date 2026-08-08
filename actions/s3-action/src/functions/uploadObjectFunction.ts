import { PutObjectCommand } from "@aws-sdk/client-s3";
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
import { FileValue, S3Object } from "../data_types/s3Object.js";
import { getBucket, getS3Client, toRuntimeError } from "../helpers.js";

@Identifier("uploadObject")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, File: FILE, Bucket?: string): S3_OBJECT")
@Name({ code: "en-US", content: "Upload object" })
@DisplayMessage({ code: "en-US", content: "Upload object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads (puts) an object into an S3 bucket via the AWS SDK. `File` is a standard FILE value (base64-encoded content plus an optional content type).\nProvide `Bucket` to override the action's configured default_bucket.",
})
@Description({
    code: "en-US",
    content: "Uploads an object into an S3 bucket.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to upload to, e.g. 'folder/file.txt'." }],
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
export class UploadObjectFunction {
    async run(context: FunctionContext, Key: string, File: FileValue, Bucket?: string): Promise<S3Object> {
        const bucket = getBucket(context, Bucket);
        const client = getS3Client(context);
        const payload = Buffer.from(File.value, "base64");
        // FILE's `contentType` is generic over TEXT at the definition level, but
        // zod resolves the generic param to `unknown` since it isn't parameterized
        // at the schema level; it's a string at runtime.
        const contentType = typeof File.contentType === "string" ? File.contentType : undefined;

        try {
            const result = await client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key,
                    Body: payload,
                    ...(contentType ? { ContentType: contentType } : {}),
                })
            );

            return {
                bucket,
                key: Key,
                etag: result.ETag ?? null,
                versionId: result.VersionId ?? null,
                contentType: contentType ?? null,
                contentLength: payload.byteLength,
                lastModified: null,
                file: null,
            };
        } catch (error) {
            throw toRuntimeError("ERROR_UPLOADING_S3_OBJECT", error, "An error occurred while uploading the S3 object.");
        }
    }
}
