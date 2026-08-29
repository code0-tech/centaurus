import { GetObjectCommand } from "@aws-sdk/client-s3";
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
import { S3Object } from "../data_types/s3Object.js";
import { getBucket, getS3Client, streamToBuffer, toRuntimeError } from "../helpers.js";

@Identifier("downloadObject")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Bucket?: string): S3_OBJECT")
@Name({ code: "en-US", content: "Download object" })
@DisplayMessage({ code: "en-US", content: "Download object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Downloads (gets) an object from an S3 bucket via the AWS SDK. The returned `File` is a standard FILE value (base64-encoded content plus content type), so it can be passed directly to other actions/functions that accept a FILE.",
})
@Description({
    code: "en-US",
    content: "Downloads an object from an S3 bucket.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to download." }],
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to download from. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class DownloadObjectFunction {
    async run(context: FunctionContext, Key: string, Bucket?: string): Promise<S3Object> {
        const bucket = getBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
            const buffer = await streamToBuffer(result.Body);

            return {
                bucket,
                key: Key,
                etag: result.ETag ?? null,
                versionId: result.VersionId ?? null,
                contentType: result.ContentType ?? null,
                contentLength: result.ContentLength ?? buffer.byteLength,
                lastModified: result.LastModified ? result.LastModified.toUTCString() : null,
                file: {
                    contentType: result.ContentType ?? null,
                    valueType: "base64",
                    value: buffer.toString("base64"),
                },
            };
        } catch (error) {
            throw toRuntimeError(
                "ERROR_DOWNLOADING_S3_OBJECT",
                error,
                "An error occurred while downloading the S3 object."
            );
        }
    }
}
