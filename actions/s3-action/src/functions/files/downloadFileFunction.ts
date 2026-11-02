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
import { getS3Client, resolveBucket, toRuntimeError } from "../../helpers.js";
import { S3ObjectContent, S3ObjectContentSchema } from "../../data_types/s3ObjectContent.js";

@Identifier("downloadFile")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Bucket?: string): S3_OBJECT_CONTENT")
@Name({ code: "en-US", content: "Download file" })
@DisplayMessage({ code: "en-US", content: "Download file ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Downloads an object from S3 and returns its content as a standard hercules FILE value (base64-encoded content plus content type), so it can be passed directly to other functions/actions that accept a FILE. To receive the body as raw text, use `Download object` instead.",
})
@Description({
    code: "en-US",
    content: "Downloads a file from S3.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to read within the bucket." }],
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to read from. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class DownloadFileFunction {
    async run(context: FunctionContext, Key: string, Bucket?: string): Promise<S3ObjectContent> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
            const bytes = (await result.Body?.transformToByteArray()) ?? new Uint8Array();

            return S3ObjectContentSchema.parse({
                Key,
                Bucket: bucket,
                File: {
                    contentType: result.ContentType,
                    fileName: Key.split("/").pop() || Key,
                    valueType: "base64",
                    value: Buffer.from(bytes).toString("base64"),
                },
                ContentLength: result.ContentLength,
                ETag: result.ETag,
                LastModified: result.LastModified?.toISOString(),
            });
        } catch (error) {
            throw toRuntimeError("S3_DOWNLOAD_FILE_FAILED", error);
        }
    }
}
