import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3ObjectSchema = z.object({
    Key: z.string(),
    Bucket: z.string(),
    ETag: z.string().optional(),
    Location: z.string(),
    VersionId: z.string().optional(),
});
export type S3Object = z.infer<typeof S3ObjectSchema>;

@Identifier("S3_OBJECT")
@Name({ code: "en-US", content: "S3 object" })
@DisplayMessage({ code: "en-US", content: "S3 object ${Key}" })
@Schema(S3ObjectSchema)
export class S3ObjectDataType {}
