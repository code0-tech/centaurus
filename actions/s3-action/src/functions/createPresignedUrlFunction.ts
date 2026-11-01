import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getS3Client, resolveBucket, toRuntimeError } from "../helpers.js";
import { S3PresignedUrl, S3PresignedUrlSchema } from "../data_types/s3PresignedUrl.js";

@Identifier("createPresignedUrl")
@DisplayIcon("simple:amazons3")
@Signature('(Key: string, Operation?: "get"|"put", ExpiresInSeconds?: number, Bucket?: string): S3_PRESIGNED_URL')
@Name({ code: "en-US", content: "Create presigned URL" })
@DisplayMessage({ code: "en-US", content: "Create presigned URL for ${Key}" })
@Documentation({
    code: "en-US",
    content:
        "Generates a temporary, signed URL that grants direct GET or PUT access to an object without sharing the configured credentials. The URL expires after ExpiresInSeconds (default 900, i.e. 15 minutes).",
})
@Description({
    code: "en-US",
    content: "Generates a temporary presigned URL for an object.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to grant access to within the bucket." }],
})
@Parameter({
    runtimeName: "Operation",
    name: [{ code: "en-US", content: "Operation" }],
    description: [{ code: "en-US", content: "Whether the URL grants read ('get') or write ('put') access. Defaults to 'get'." }],
    optional: true,
})
@Parameter({
    runtimeName: "ExpiresInSeconds",
    name: [{ code: "en-US", content: "Expires in (seconds)" }],
    description: [{ code: "en-US", content: "How long the URL stays valid, in seconds. Defaults to 900 (15 minutes)." }],
    optional: true,
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket the object lives in. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class CreatePresignedUrlFunction {
    async run(
        context: FunctionContext,
        Key: string,
        Operation?: "get" | "put",
        ExpiresInSeconds?: number,
        Bucket?: string
    ): Promise<S3PresignedUrl> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);
        const operation = Operation ?? "get";
        const expiresIn = ExpiresInSeconds ?? 900;

        if (operation !== "get" && operation !== "put") {
            throw new RuntimeError("S3_INVALID_PRESIGNED_URL_OPERATION", `Operation must be 'get' or 'put', got '${operation}'.`);
        }

        try {
            const command =
                operation === "get" ? new GetObjectCommand({ Bucket: bucket, Key }) : new PutObjectCommand({ Bucket: bucket, Key });
            const url = await getSignedUrl(client, command, { expiresIn });

            return S3PresignedUrlSchema.parse({
                Url: url,
                Key,
                Bucket: bucket,
                Operation: operation,
                ExpiresInSeconds: expiresIn,
            });
        } catch (error) {
            throw toRuntimeError("S3_CREATE_PRESIGNED_URL_FAILED", error);
        }
    }
}
