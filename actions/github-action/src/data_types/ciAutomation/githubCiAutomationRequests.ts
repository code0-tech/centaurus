import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateCommitStatusRequestSchema = z.object({
    state: z.enum(["error", "failure", "pending", "success"]),
    target_url: z.string().optional(),
    description: z.string().optional(),
    context: z.string().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/statuses/{sha}"]["parameters"], "owner" | "repo" | "sha">>
export type GitHubCreateCommitStatusRequest = z.infer<typeof GitHubCreateCommitStatusRequestSchema>

export const GitHubCreateCheckRunRequestSchema = z.looseObject({
    name: z.string().min(1),
    head_sha: z.string().min(1),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/check-runs"]["parameters"], "owner" | "repo">>
export type GitHubCreateCheckRunRequest = z.infer<typeof GitHubCreateCheckRunRequestSchema>

export const GitHubUpdateCheckRunRequestSchema = z.looseObject({}) as unknown as z.ZodType<
    Omit<Endpoints["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]["parameters"], "owner" | "repo" | "check_run_id">
>
export type GitHubUpdateCheckRunRequest = z.infer<typeof GitHubUpdateCheckRunRequestSchema>

@Identifier("GITHUB_CREATE_COMMIT_STATUS_REQUEST")
@Name({ code: "en-US", content: "Create GitHub commit status request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub commit status request" })
@Schema(GitHubCreateCommitStatusRequestSchema)
export class GitHubCreateCommitStatusRequestDataType {}

@Identifier("GITHUB_CREATE_CHECK_RUN_REQUEST")
@Name({ code: "en-US", content: "Create GitHub check run request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub check run request" })
@Schema(GitHubCreateCheckRunRequestSchema)
export class GitHubCreateCheckRunRequestDataType {}

@Identifier("GITHUB_UPDATE_CHECK_RUN_REQUEST")
@Name({ code: "en-US", content: "Update GitHub check run request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub check run request" })
@Schema(GitHubUpdateCheckRunRequestSchema)
export class GitHubUpdateCheckRunRequestDataType {}
