import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3ObjectContentSchema = z.object({
    Key: z.string(),
    Bucket: z.string(),
    Content: z.string(),
    ContentType: z.string().optional(),
    ContentLength: z.number().optional(),
    ETag: z.string().optional(),
    LastModified: z.string().optional(),
});
export type S3ObjectContent = z.infer<typeof S3ObjectContentSchema>;

@Identifier("S3_OBJECT_CONTENT")
@Name({ code: "en-US", content: "S3 object content" })
@DisplayMessage({ code: "en-US", content: "S3 object content ${Key}" })
@Schema(S3ObjectContentSchema)
export class S3ObjectContentDataType {}
