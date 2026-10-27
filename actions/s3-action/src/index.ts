import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { S3ObjectDataType } from "./data_types/s3Object.js";
import { S3ObjectListDataType, S3ObjectSummaryDataType } from "./data_types/s3ObjectList.js";
import { S3DeleteResultDataType } from "./data_types/s3DeleteResult.js";
import { UploadObjectFunction } from "./functions/uploadObjectFunction.js";
import { DownloadObjectFunction } from "./functions/downloadObjectFunction.js";
import { ListObjectsFunction } from "./functions/listObjectsFunction.js";
import { DeleteObjectFunction } from "./functions/deleteObjectFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "s3-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "CodeZero",
    "tabler:bucket",
    "S3 / Object Storage integration: upload, download, list, and delete objects via the AWS S3 API (also works with any S3-compatible provider through a custom endpoint).",
    [{ code: "en-US", content: "S3 / Object Storage" }],
    [
        {
            identifier: "access_key_id",
            type: "TEXT",
            optional: true,
            name: [{ code: "en-US", content: "Access key ID" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The AWS (or S3-compatible provider) access key ID used to authenticate. Leave empty to fall back to the AWS SDK's default credential provider chain (environment variables, shared config file, or an IAM role).",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "secret_access_key",
            type: "TEXT",
            optional: true,
            name: [{ code: "en-US", content: "Secret access key" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The AWS (or S3-compatible provider) secret access key used to authenticate. Leave empty to fall back to the AWS SDK's default credential provider chain.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "region",
            type: "TEXT",
            defaultValue: "us-east-1",
            name: [{ code: "en-US", content: "Region" }],
            description: [{ code: "en-US", content: "The AWS region to send requests to, e.g. 'eu-central-1'." }],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "endpoint",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Custom endpoint" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "Optional custom S3 API endpoint URL. Set this to use an S3-compatible provider (e.g. MinIO, Cloudflare R2, DigitalOcean Spaces) instead of AWS. Leave empty to use AWS S3.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "default_bucket",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Default bucket" }],
            description: [
                {
                    code: "en-US",
                    content: "The default bucket used when a function call does not specify a Bucket value.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(S3ObjectDataType);
action.registerDataTypeClass(S3ObjectSummaryDataType);
action.registerDataTypeClass(S3ObjectListDataType);
action.registerDataTypeClass(S3DeleteResultDataType);

action.registerRuntimeFunction(UploadObjectFunction);
action.registerRuntimeFunction(DownloadObjectFunction);
action.registerRuntimeFunction(ListObjectsFunction);
action.registerRuntimeFunction(DeleteObjectFunction);

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        });
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null });
    console.dir(action.configs.values(), { depth: null });
});

export { action };
