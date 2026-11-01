import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubIssueOpenedWebhookPayloadSchema = schemas["webhook-issues-opened"]

@Identifier("GitHubIssueOpenedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue opened webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue opened webhook payload" })
@Schema(GitHubIssueOpenedWebhookPayloadSchema)
export class GitHubIssueOpenedWebhookPayloadDataType {}
