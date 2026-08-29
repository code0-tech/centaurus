import { DisplayMessage, fileSchema, Identifier, Name, Schema } from "@code0-tech/hercules";
import type { File as StdFile } from "@code0-tech/hercules";
import { z } from "zod";

export type FileValue = StdFile;

/**
 * Represents an S3 object returned from an upload, download, or list
 * operation. `File` (present after a download) carries the object content
 * as a std FILE value from the `taurus-file` module.
 */
export const S3ObjectSchema = z.object({
    bucket: z.string(),
    key: z.string(),
    etag: z.string().nullish(),
    versionId: z.string().nullish(),
    contentType: z.string().nullish(),
    contentLength: z.number().nullish(),
    lastModified: z.string().nullish(),
    file: fileSchema.nullish(),
});
export type S3Object = z.infer<typeof S3ObjectSchema>;

@Identifier("S3_OBJECT")
@Name({ code: "en-US", content: "S3 object" })
@DisplayMessage({ code: "en-US", content: "S3 object" })
@Schema(S3ObjectSchema)
export class S3ObjectDataType {}
