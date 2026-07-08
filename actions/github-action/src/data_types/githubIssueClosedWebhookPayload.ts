import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubIssueClosedWebhookPayloadSchema = z.custom<components["schemas"]["webhook-issues-closed"]>()

@Identifier("GitHubIssueClosedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue closed webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue closed webhook payload" })
@Schema(GitHubIssueClosedWebhookPayloadSchema)
export class GitHubIssueClosedWebhookPayloadDataType {}
