import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubPullRequestOpenedWebhookPayloadSchema = z.custom<components["schemas"]["webhook-pull-request-opened"]>()

@Identifier("GitHubPullRequestOpenedWebhookPayload")
@Name({ code: "en-US", content: "GitHub pull request opened webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request opened webhook payload" })
@Schema(GitHubPullRequestOpenedWebhookPayloadSchema)
export class GitHubPullRequestOpenedWebhookPayloadDataType {}
