import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubPushWebhookPayloadSchema = z.looseObject({
    ref: z.string(),
    before: z.string(),
    after: z.string(),
    repository: z.looseObject({}),
    sender: z.looseObject({}),
}) as unknown as z.ZodType<components["schemas"]["webhook-push"]>

@Identifier("GitHubPushWebhookPayload")
@Name({ code: "en-US", content: "GitHub push webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub push webhook payload" })
@Schema(GitHubPushWebhookPayloadSchema)
export class GitHubPushWebhookPayloadDataType {}
