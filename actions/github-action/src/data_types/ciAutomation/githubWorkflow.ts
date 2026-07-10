import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubWorkflowSchema = z.looseObject({}) as unknown as z.ZodType<Endpoints["GET /repos/{owner}/{repo}/actions/workflows"]["response"]["data"]["workflows"][number]>
export type GitHubWorkflow = z.infer<typeof GitHubWorkflowSchema>

export const GitHubWorkflowRunSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"]["workflow_runs"][number]
>
export type GitHubWorkflowRun = z.infer<typeof GitHubWorkflowRunSchema>

@Identifier("GITHUB_WORKFLOW")
@Name({ code: "en-US", content: "GitHub workflow" })
@DisplayMessage({ code: "en-US", content: "GitHub workflow" })
@Schema(GitHubWorkflowSchema)
export class GitHubWorkflowDataType {}

@Identifier("GITHUB_WORKFLOW_RUN")
@Name({ code: "en-US", content: "GitHub workflow run" })
@DisplayMessage({ code: "en-US", content: "GitHub workflow run" })
@Schema(GitHubWorkflowRunSchema)
export class GitHubWorkflowRunDataType {}
