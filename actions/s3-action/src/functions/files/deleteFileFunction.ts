import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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
import { S3DeleteResult, S3DeleteResultSchema } from "../../data_types/s3DeleteResult.js";

@Identifier("deleteFile")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Bucket?: string): S3_DELETE_RESULT")
@Name({ code: "en-US", content: "Delete file" })
@DisplayMessage({ code: "en-US", content: "Delete file ${Key}" })
@Documentation({
    code: "en-US",
    content: "Deletes a file from S3 by its key. Deleting a key that does not exist is not an error.",
})
@Description({
    code: "en-US",
    content: "Deletes a file from S3.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to delete within the bucket." }],
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to delete from. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class DeleteFileFunction {
    async run(context: FunctionContext, Key: string, Bucket?: string): Promise<S3DeleteResult> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));

            return S3DeleteResultSchema.parse({
                Key,
                Bucket: bucket,
                Deleted: true,
                DeleteMarker: result.DeleteMarker,
                VersionId: result.VersionId,
            });
        } catch (error) {
            throw toRuntimeError("S3_DELETE_FILE_FAILED", error);
        }
    }
}
