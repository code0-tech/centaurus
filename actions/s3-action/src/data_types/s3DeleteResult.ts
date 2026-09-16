import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3DeleteResultSchema = z.object({
    bucket: z.string(),
    key: z.string(),
    deleted: z.boolean(),
    deleteMarker: z.boolean().nullish(),
    versionId: z.string().nullish(),
});
export type S3DeleteResult = z.infer<typeof S3DeleteResultSchema>;

@Identifier("S3_DELETE_RESULT")
@Name({ code: "en-US", content: "S3 delete result" })
@DisplayMessage({ code: "en-US", content: "S3 delete result" })
@Schema(S3DeleteResultSchema)
export class S3DeleteResultDataType {}
