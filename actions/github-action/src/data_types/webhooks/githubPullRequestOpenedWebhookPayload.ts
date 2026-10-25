import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestOpenedWebhookPayloadSchema = schemas["webhook-pull-request-opened"]

@Identifier("GitHubPullRequestOpenedWebhookPayload")
@Name({ code: "en-US", content: "GitHub pull request opened webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request opened webhook payload" })
@Schema(GitHubPullRequestOpenedWebhookPayloadSchema)
export class GitHubPullRequestOpenedWebhookPayloadDataType {}
