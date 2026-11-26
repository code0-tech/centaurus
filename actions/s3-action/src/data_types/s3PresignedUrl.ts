import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const S3PresignedUrlSchema = z.object({
    Url: z.string(),
    Key: z.string(),
    Bucket: z.string(),
    Operation: z.enum(["get", "put"]),
    ExpiresInSeconds: z.number(),
});
export type S3PresignedUrl = z.infer<typeof S3PresignedUrlSchema>;

@Identifier("S3_PRESIGNED_URL")
@Name({ code: "en-US", content: "S3 presigned URL" })
@DisplayMessage({ code: "en-US", content: "Presigned URL for ${Key}" })
@Schema(S3PresignedUrlSchema)
export class S3PresignedUrlDataType {}
