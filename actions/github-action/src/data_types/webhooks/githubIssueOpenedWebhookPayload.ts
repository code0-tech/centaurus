import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { components } from "@octokit/openapi-webhooks-types"
import { z } from "zod"

export const GitHubIssueOpenedWebhookPayloadSchema = z.looseObject({
    action: z.literal("opened"),
    issue: z.looseObject({}),
    repository: z.looseObject({}),
    sender: z.looseObject({}),
}) as unknown as z.ZodType<components["schemas"]["webhook-issues-opened"]>

@Identifier("GitHubIssueOpenedWebhookPayload")
@Name({ code: "en-US", content: "GitHub issue opened webhook payload" })
@DisplayMessage({ code: "en-US", content: "GitHub issue opened webhook payload" })
@Schema(GitHubIssueOpenedWebhookPayloadSchema)
export class GitHubIssueOpenedWebhookPayloadDataType {}
