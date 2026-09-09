import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubPullRequestClosedWebhookPayloadSchema = z.looseObject({
    action: z.literal("closed"),
    pull_request: z.looseObject({}),
    repository: z.looseObject({}),
    sender: z.looseObject({}),
}) as unknown as z.ZodType<components["schemas"]["webhook-pull-request-closed"]>

@Identifier("GitHubPullRequestClosedWebhookPayload")
@Name({ code: "en-US", content: "GitHub pull request closed webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub pull request closed webhook payload" })
@Schema(GitHubPullRequestClosedWebhookPayloadSchema)
export class GitHubPullRequestClosedWebhookPayloadDataType {}
