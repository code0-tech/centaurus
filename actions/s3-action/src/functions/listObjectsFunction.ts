import { ListObjectsV2Command } from "@aws-sdk/client-s3";
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
import { S3ObjectList, S3ObjectListSchema } from "../data_types/s3ObjectList.js";

@Identifier("listObjects")
@DisplayIcon("simple:amazons3")
@Signature("(Prefix?: string, Bucket?: string, MaxKeys?: number, ContinuationToken?: string): S3_OBJECT_LIST")
@Name({ code: "en-US", content: "List objects" })
@DisplayMessage({ code: "en-US", content: "List objects in ${Bucket}" })
@Documentation({
    code: "en-US",
    content:
        "Lists objects in a bucket, optionally filtered by key prefix. Results are paginated; pass the returned NextContinuationToken back in as ContinuationToken to fetch the next page.",
})
@Description({
    code: "en-US",
    content: "Lists objects in a bucket.",
})
@Parameter({
    runtimeName: "Prefix",
    name: [{ code: "en-US", content: "Prefix" }],
    description: [{ code: "en-US", content: "Only return objects whose key starts with this prefix." }],
    optional: true,
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to list. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "MaxKeys",
    name: [{ code: "en-US", content: "Max keys" }],
    description: [{ code: "en-US", content: "The maximum number of keys to return in one page. Defaults to 1000." }],
    optional: true,
})
@Parameter({
    runtimeName: "ContinuationToken",
    name: [{ code: "en-US", content: "Continuation token" }],
    description: [{ code: "en-US", content: "Token from a previous call's NextContinuationToken, to fetch the next page." }],
    optional: true,
})
export class ListObjectsFunction {
    async run(
        context: FunctionContext,
        Prefix?: string,
        Bucket?: string,
        MaxKeys?: number,
        ContinuationToken?: string
    ): Promise<S3ObjectList> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);

        try {
            const result = await client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    ...(Prefix ? { Prefix } : {}),
                    ...(MaxKeys ? { MaxKeys } : {}),
                    ...(ContinuationToken ? { ContinuationToken } : {}),
                })
            );

            return S3ObjectListSchema.parse({
                Bucket: bucket,
                Prefix,
                Objects: (result.Contents ?? []).map((object) => ({
                    Key: object.Key,
                    Size: object.Size,
                    ETag: object.ETag,
                    LastModified: object.LastModified?.toISOString(),
                    StorageClass: object.StorageClass,
                })),
                IsTruncated: result.IsTruncated,
                NextContinuationToken: result.NextContinuationToken,
            });
        } catch (error) {
            throw toRuntimeError("S3_LIST_OBJECTS_FAILED", error);
        }
    }
}
