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
import { getS3Client, resolveBucket, toRuntimeError } from "../helpers.js";
import { S3Object, S3ObjectSchema } from "../data_types/s3Object.js";

@Identifier("putObject")
@DisplayIcon("simple:amazons3")
@Signature("(Key: string, Content: string, ContentType?: string, Bucket?: string): S3_OBJECT")
@Name({ code: "en-US", content: "Upload object" })
@DisplayMessage({ code: "en-US", content: "Upload object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads a UTF-8 text object to S3 (or an S3-compatible provider), creating it or overwriting an existing object with the same key.",
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
    runtimeName: "Content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The UTF-8 text content to store as the object body." }],
})
@Parameter({
    runtimeName: "ContentType",
    name: [{ code: "en-US", content: "Content type" }],
    description: [{ code: "en-US", content: "The MIME type of the content, e.g. application/json or text/plain." }],
    optional: true,
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
    async run(
        context: FunctionContext,
        Key: string,
        Content: string,
        ContentType?: string,
        Bucket?: string
    ): Promise<S3Object> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key,
                    Body: Content,
                    ...(ContentType ? { ContentType } : {}),
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
