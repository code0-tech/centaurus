import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3ObjectSummarySchema = z.object({
    key: z.string(),
    size: z.number().nullish(),
    etag: z.string().nullish(),
    lastModified: z.string().nullish(),
    storageClass: z.string().nullish(),
});
export type S3ObjectSummary = z.infer<typeof S3ObjectSummarySchema>;

export const S3ObjectListSchema = z.object({
    bucket: z.string(),
    prefix: z.string().nullish(),
    isTruncated: z.boolean().nullish(),
    nextContinuationToken: z.string().nullish(),
    keyCount: z.number().nullish(),
    objects: z.array(S3ObjectSummarySchema),
});
export type S3ObjectList = z.infer<typeof S3ObjectListSchema>;

@Identifier("S3_OBJECT_SUMMARY")
@Name({ code: "en-US", content: "S3 object summary" })
@DisplayMessage({ code: "en-US", content: "S3 object summary" })
@Schema(S3ObjectSummarySchema)
export class S3ObjectSummaryDataType {}

@Identifier("S3_OBJECT_LIST")
@Name({ code: "en-US", content: "S3 object list" })
@DisplayMessage({ code: "en-US", content: "S3 object list" })
@Schema(S3ObjectListSchema)
export class S3ObjectListDataType {}
