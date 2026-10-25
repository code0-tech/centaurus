import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"

export const GitHubWorkflowSchema = schemas["workflow"]
export type GitHubWorkflow = z.infer<typeof GitHubWorkflowSchema>

export const GitHubWorkflowRunSchema = schemas["workflow-run"]
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
