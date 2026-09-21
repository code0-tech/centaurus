import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubDispatchWorkflowRequestSchema = z.object({
    ref: z.string().min(1),
    inputs: z.record(z.string(), z.unknown()).optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"]["parameters"], "owner" | "repo" | "workflow_id">>
export type GitHubDispatchWorkflowRequest = z.infer<typeof GitHubDispatchWorkflowRequestSchema>

@Identifier("GITHUB_DISPATCH_WORKFLOW_REQUEST")
@Name({ code: "en-US", content: "Dispatch GitHub workflow request" })
@DisplayMessage({ code: "en-US", content: "Dispatch GitHub workflow request" })
@Schema(GitHubDispatchWorkflowRequestSchema)
export class GitHubDispatchWorkflowRequestDataType {}
