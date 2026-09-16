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
import { S3ObjectList } from "../data_types/s3ObjectList.js";
import { getBucket, getS3Client, toRuntimeError } from "../helpers.js";

@Identifier("listObjects")
@DisplayIcon("tabler:bucket")
@Signature("(Bucket?: string, Prefix?: string, MaxKeys?: number, ContinuationToken?: string): S3_OBJECT_LIST")
@Name({ code: "en-US", content: "List objects" })
@DisplayMessage({ code: "en-US", content: "List objects in ${Bucket}" })
@Documentation({
    code: "en-US",
    content:
        "Lists objects in an S3 bucket via the ListObjectsV2 API. Use `Prefix` to filter by key prefix (folder-like listing) and `ContinuationToken` (from a previous call's response) to page through results.",
})
@Description({
    code: "en-US",
    content: "Lists objects in an S3 bucket, optionally filtered by prefix.",
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
    runtimeName: "Prefix",
    name: [{ code: "en-US", content: "Prefix" }],
    description: [{ code: "en-US", content: "Only return keys starting with this prefix, e.g. 'folder/'." }],
    optional: true,
})
@Parameter({
    runtimeName: "MaxKeys",
    name: [{ code: "en-US", content: "Max keys" }],
    description: [{ code: "en-US", content: "The maximum number of keys to return. Defaults to 1000." }],
    optional: true,
})
@Parameter({
    runtimeName: "ContinuationToken",
    name: [{ code: "en-US", content: "Continuation token" }],
    description: [
        { code: "en-US", content: "Token from a previous List objects call's NextContinuationToken, used to page through results." },
    ],
    optional: true,
})
export class ListObjectsFunction {
    async run(
        context: FunctionContext,
        Bucket?: string,
        Prefix?: string,
        MaxKeys?: number,
        ContinuationToken?: string
    ): Promise<S3ObjectList> {
        const bucket = getBucket(context, Bucket);
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

            return {
                bucket,
                prefix: Prefix ?? null,
                isTruncated: result.IsTruncated ?? false,
                nextContinuationToken: result.NextContinuationToken ?? null,
                keyCount: result.KeyCount ?? (result.Contents?.length ?? 0),
                objects: (result.Contents ?? []).map((object) => ({
                    key: object.Key ?? "",
                    size: object.Size ?? null,
                    etag: object.ETag ?? null,
                    lastModified: object.LastModified ? object.LastModified.toUTCString() : null,
                    storageClass: object.StorageClass ?? null,
                })),
            };
        } catch (error) {
            throw toRuntimeError("ERROR_LISTING_S3_OBJECTS", error, "An error occurred while listing S3 objects.");
        }
    }
}
