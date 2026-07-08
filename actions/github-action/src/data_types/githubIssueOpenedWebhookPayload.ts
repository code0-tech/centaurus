import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubIssueOpenedWebhookPayloadSchema = z.custom<components["schemas"]["webhook-issues-opened"]>()

@Identifier("GitHubIssueOpenedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue opened webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue opened webhook payload" })
@Schema(GitHubIssueOpenedWebhookPayloadSchema)
export class GitHubIssueOpenedWebhookPayloadDataType {}
