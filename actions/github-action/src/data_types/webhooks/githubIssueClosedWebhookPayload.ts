import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubIssueClosedWebhookPayloadSchema = schemas["webhook-issues-closed"]

@Identifier("GitHubIssueClosedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue closed webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue closed webhook payload" })
@Schema(GitHubIssueClosedWebhookPayloadSchema)
export class GitHubIssueClosedWebhookPayloadDataType {}
