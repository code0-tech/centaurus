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
import { S3ObjectData, S3ObjectDataSchema } from "../../data_types/s3ObjectData.js";

@Identifier("downloadObject")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Bucket?: string): S3_OBJECT_DATA")
@Name({ code: "en-US", content: "Download object" })
@DisplayMessage({ code: "en-US", content: "Download object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Downloads an object from S3 and returns its body as raw UTF-8 text. This is the object-storage primitive; to receive the content as a hercules FILE value (base64, for binary content or chaining into FILE-consuming functions), use `Download file` instead.",
})
@Description({
    code: "en-US",
    content: "Downloads an object from S3 as raw data.",
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
export class DownloadObjectFunction {
    async run(context: FunctionContext, Key: string, Bucket?: string): Promise<S3ObjectData> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
            const data = (await result.Body?.transformToString("utf-8")) ?? "";

            return S3ObjectDataSchema.parse({
                Key,
                Bucket: bucket,
                Data: data,
                ContentType: result.ContentType,
                ContentLength: result.ContentLength,
                ETag: result.ETag,
                LastModified: result.LastModified?.toISOString(),
            });
        } catch (error) {
            throw toRuntimeError("S3_DOWNLOAD_OBJECT_FAILED", error);
        }
    }
}
