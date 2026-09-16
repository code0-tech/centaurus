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
import { S3DeleteResult } from "../data_types/s3DeleteResult.js";
import { getBucket, getS3Client, toRuntimeError } from "../helpers.js";

@Identifier("deleteObject")
@DisplayIcon("tabler:bucket")
@Signature("(Key: string, Bucket?: string): S3_DELETE_RESULT")
@Name({ code: "en-US", content: "Delete object" })
@DisplayMessage({ code: "en-US", content: "Delete object ${Key}" })
@Documentation({
    code: "en-US",
    content: "Deletes an object from an S3 bucket via the AWS SDK.",
})
@Description({
    code: "en-US",
    content: "Deletes an object from an S3 bucket.",
})
@Parameter({
    runtimeName: "Key",
    name: [{ code: "en-US", content: "Key" }],
    description: [{ code: "en-US", content: "The object key (path) to delete." }],
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to delete from. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class DeleteObjectFunction {
    async run(context: FunctionContext, Key: string, Bucket?: string): Promise<S3DeleteResult> {
        const bucket = getBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));

            return {
                bucket,
                key: Key,
                deleted: true,
                deleteMarker: result.DeleteMarker ?? null,
                versionId: result.VersionId ?? null,
            };
        } catch (error) {
            throw toRuntimeError("ERROR_DELETING_S3_OBJECT", error, "An error occurred while deleting the S3 object.");
        }
    }
}
