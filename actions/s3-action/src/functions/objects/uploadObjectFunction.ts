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
import { getS3Client, resolveBucket, toRuntimeError } from "../../helpers.js";
import { S3Object, S3ObjectSchema } from "../../data_types/s3Object.js";

@Identifier("uploadObject")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Data: string, ContentType?: string, Bucket?: string): S3_OBJECT")
@Name({ code: "en-US", content: "Upload object" })
@DisplayMessage({ code: "en-US", content: "Upload object ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads a single object to S3 (or an S3-compatible provider) at the exact `Key` given, from raw textual `Data`. This is the object-storage primitive: the key is explicit and the body is a UTF-8 string. To upload binary content or hercules FILE values, use `Upload files` instead.",
})
@Description({
    code: "en-US",
    content: "Uploads raw data to S3 at an explicit key.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to write within the bucket." }],
})
@Parameter({
    runtimeName: "Data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The object body, as UTF-8 text." }],
})
@Parameter({
    runtimeName: "ContentType",
    name: [{ code: "en-US", content: "Content type" }],
    description: [
        { code: "en-US", content: "Optional MIME type stored with the object. Defaults to 'text/plain; charset=utf-8'." },
    ],
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
export class UploadObjectFunction {
    async run(context: FunctionContext, Key: string, Data: string, ContentType?: string, Bucket?: string): Promise<S3Object> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);
        const contentType = ContentType || "text/plain; charset=utf-8";

        try {
            const result = await client.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key,
                    Body: Buffer.from(Data ?? "", "utf-8"),
                    ContentType: contentType,
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
            throw toRuntimeError("S3_UPLOAD_OBJECT_FAILED", error);
        }
    }
}
