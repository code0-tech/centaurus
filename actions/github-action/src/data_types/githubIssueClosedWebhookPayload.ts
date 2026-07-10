import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubIssueClosedWebhookPayloadSchema = z.looseObject({
    action: z.literal("closed"),
    issue: z.looseObject({}),
    repository: z.looseObject({}),
    sender: z.looseObject({}),
}) as unknown as z.ZodType<components["schemas"]["webhook-issues-closed"]>

@Identifier("GitHubIssueClosedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue closed webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue closed webhook payload" })
@Schema(GitHubIssueClosedWebhookPayloadSchema)
export class GitHubIssueClosedWebhookPayloadDataType {}
