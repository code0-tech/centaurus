import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { File } from "@code0-tech/hercules";
import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { getS3Client, resolveBucket, resolveObjectKey, toRuntimeError } from "../../helpers.js";
import { S3Object, S3ObjectSchema } from "../../data_types/s3Object.js";

@Identifier("uploadFiles")
@DisplayIcon("tabler:bucket")
@Signature('(Files: FILE<"*/*">[], KeyPrefix?: string, Bucket?: string): S3_OBJECT[]')
@Name({ code: "en-US", content: "Upload files" })
@DisplayMessage({ code: "en-US", content: "Upload files under ${KeyPrefix}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads one or more files (standard hercules FILE values: base64 content plus a file name and optional content type) to S3, creating them or overwriting existing objects with the same key. Each file's key is its own name, optionally placed under `KeyPrefix` (e.g. `reports/`). To upload raw data at an explicit key, use `Upload object` instead.",
})
@Description({
    code: "en-US",
    content: "Uploads one or more files to S3.",
})
@Parameter({
    runtimeName: "Files",
    name: [{ code: "en-US", content: "Files" }],
    description: [
        {
            code: "en-US",
            content: "The files to upload, as standard FILE values. Each file's name becomes its object key.",
        },
    ],
})
@Parameter({
    runtimeName: "KeyPrefix",
    name: [{ code: "en-US", content: "Key prefix" }],
    description: [
        {
            code: "en-US",
            content:
                "Optional key prefix (folder) the files are uploaded under, e.g. `reports/`. Joined to each file name with a `/`. Omit to upload at the bucket root under each file's name.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "Bucket",
    name: [{ code: "en-US", content: "Bucket" }],
    description: [
        { code: "en-US", content: "The bucket to upload to. Falls back to the configured default bucket when omitted." },
    ],
    optional: true,
})
export class UploadFilesFunction {
    async run(context: FunctionContext, Files: File<"*/*">[], KeyPrefix?: string, Bucket?: string): Promise<S3Object[]> {
        const bucket = resolveBucket(context, Bucket);
        const client = getS3Client(context);
        const files = Files ?? [];

        try {
            return await Promise.all(
                files.map(async (file) => {
                    const key = resolveObjectKey(file.fileName, KeyPrefix);
                    const body = Buffer.from(file.value, "base64");
                    // `file.contentType` is generic/unknown at the schema level (hercules'
                    // FILE value doesn't parameterize it), but it's a string at runtime.
                    const contentType = typeof file.contentType === "string" ? file.contentType : undefined;

                    const result = await client.send(
                        new PutObjectCommand({
                            Bucket: bucket,
                            Key: key,
                            Body: body,
                            ...(contentType ? { ContentType: contentType } : {}),
                        })
                    );

                    return S3ObjectSchema.parse({
                        Key: key,
                        Bucket: bucket,
                        ETag: result.ETag,
                        Location: `${bucket}/${key}`,
                        VersionId: result.VersionId,
                    });
                })
            );
        } catch (error) {
            throw toRuntimeError("S3_UPLOAD_FILES_FAILED", error);
        }
    }
}
