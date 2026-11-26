import { DisplayMessage, fileSchema, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * File carries the downloaded body as a std FILE value (base64 content plus
 * file name/content type) from hercules' `taurus-file` module, so it can be
 * passed directly into any other function/action that accepts a FILE.
 */
export const S3ObjectContentSchema = z.object({
    Key: z.string(),
    Bucket: z.string(),
    File: fileSchema,
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
