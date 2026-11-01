import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { S3ObjectDataType } from "./data_types/s3Object.js";
import { S3ObjectContentDataType } from "./data_types/s3ObjectContent.js";
import { S3DeleteResultDataType } from "./data_types/s3DeleteResult.js";
import { S3ObjectListDataType } from "./data_types/s3ObjectList.js";
import { S3PresignedUrlDataType } from "./data_types/s3PresignedUrl.js";

import { PutObjectFunction } from "./functions/putObjectFunction.js";
import { GetObjectFunction } from "./functions/getObjectFunction.js";
import { DeleteObjectFunction } from "./functions/deleteObjectFunction.js";
import { ListObjectsFunction } from "./functions/listObjectsFunction.js";
import { CreatePresignedUrlFunction } from "./functions/createPresignedUrlFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "s3-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "CodeZero",
    "simple:amazons3",
    "S3 / object storage integration: upload, download, list, and delete objects, and generate presigned URLs, against AWS S3 or any S3-compatible provider.",
    [{ code: "en-US", content: "S3" }],
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
                        "The access key ID used to authenticate with the S3 API. Leave empty to fall back to the AWS SDK's default credential provider chain (environment variables, shared config file, or an IAM role).",
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
                        "The secret access key used to authenticate with the S3 API. Leave empty to fall back to the AWS SDK's default credential provider chain.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "region",
            type: "TEXT",
            defaultValue: "us-east-1",
            name: [{ code: "en-US", content: "Region" }],
            description: [
                {
                    code: "en-US",
                    content: "The region to connect to, e.g. us-east-1. S3-compatible providers may require a placeholder such as 'auto'.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "endpoint",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Endpoint" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "Optional custom endpoint URL for S3-compatible providers (MinIO, Cloudflare R2, DigitalOcean Spaces, ...). Leave empty to use AWS S3.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "bucket",
            type: "TEXT",
            defaultValue: "",
            name: [{ code: "en-US", content: "Default bucket" }],
            description: [
                { code: "en-US", content: "Optional default bucket used when a function call does not specify one." },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(S3ObjectDataType);
action.registerDataTypeClass(S3ObjectContentDataType);
action.registerDataTypeClass(S3DeleteResultDataType);
action.registerDataTypeClass(S3ObjectListDataType);
action.registerDataTypeClass(S3PresignedUrlDataType);

action.registerRuntimeFunction(PutObjectFunction);
action.registerRuntimeFunction(GetObjectFunction);
action.registerRuntimeFunction(DeleteObjectFunction);
action.registerRuntimeFunction(ListObjectsFunction);
action.registerRuntimeFunction(CreatePresignedUrlFunction);

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
