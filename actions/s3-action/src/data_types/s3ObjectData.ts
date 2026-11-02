import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * The raw (textual) body of an S3 object, used by the "object" function set.
 * Unlike {@link S3_OBJECT_CONTENT} (the "file" set), this does not wrap a std
 * FILE value: `Data` is the object body decoded as UTF-8 text, so it can be
 * fed straight into text-oriented functions. Binary payloads should use the
 * file set instead, which exchanges content as base64 FILE values.
 */
export const S3ObjectDataSchema = z.object({
    Key: z.string(),
    Bucket: z.string(),
    Data: z.string(),
    ContentType: z.string().optional(),
    ContentLength: z.number().optional(),
    ETag: z.string().optional(),
    LastModified: z.string().optional(),
});
export type S3ObjectData = z.infer<typeof S3ObjectDataSchema>;

@Identifier("S3_OBJECT_DATA")
@Name({ code: "en-US", content: "S3 object data" })
@DisplayMessage({ code: "en-US", content: "S3 object data ${Key}" })
@Schema(S3ObjectDataSchema)
export class S3ObjectDataDataType {}
