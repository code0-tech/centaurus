import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3DeleteResultSchema = z.object({
    Key: z.string(),
    Bucket: z.string(),
    Deleted: z.boolean(),
    DeleteMarker: z.boolean().optional(),
    VersionId: z.string().optional(),
});
export type S3DeleteResult = z.infer<typeof S3DeleteResultSchema>;

@Identifier("S3_DELETE_RESULT")
@Name({ code: "en-US", content: "S3 delete result" })
@DisplayMessage({ code: "en-US", content: "Deleted S3 object ${Key}" })
@Schema(S3DeleteResultSchema)
export class S3DeleteResultDataType {}
