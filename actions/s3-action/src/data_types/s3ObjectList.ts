import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3ObjectListSchema = z.object({
    Bucket: z.string(),
    Prefix: z.string().optional(),
    Objects: z.array(
        z.object({
            Key: z.string(),
            Size: z.number().optional(),
            ETag: z.string().optional(),
            LastModified: z.string().optional(),
        })
    ),
    IsTruncated: z.boolean().optional(),
    NextContinuationToken: z.string().optional(),
});
export type S3ObjectList = z.infer<typeof S3ObjectListSchema>;

@Identifier("S3_OBJECT_LIST")
@Name({ code: "en-US", content: "S3 object list" })
@DisplayMessage({ code: "en-US", content: "S3 objects in ${Bucket}" })
@Schema(S3ObjectListSchema)
export class S3ObjectListDataType {}
