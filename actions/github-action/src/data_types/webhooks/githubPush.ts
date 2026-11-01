import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPushWebhookPayloadSchema = schemas["webhook-push"]

@Identifier("GitHubPushWebhookPayload")
@Name({ code: "en-US", content: "GitHub push webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub push webhook payload" })
@Schema(GitHubPushWebhookPayloadSchema)
export class GitHubPushWebhookPayloadDataType {}
