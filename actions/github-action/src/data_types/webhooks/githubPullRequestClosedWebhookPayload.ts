import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubPullRequestClosedWebhookPayloadSchema = schemas["webhook-pull-request-closed"]

@Identifier("GitHubPullRequestClosedWebhookPayload")
@Name({ code: "en-US", content: "GitHub pull request closed webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request closed webhook payload" })
@Schema(GitHubPullRequestClosedWebhookPayloadSchema)
export class GitHubPullRequestClosedWebhookPayloadDataType {}
