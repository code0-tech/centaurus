import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreatePullRequestRequestSchema = z.object({
    title: z.string().min(1),
    head: z.string().min(1),
    base: z.string().min(1),
    body: z.string().optional(),
    draft: z.boolean().optional(),
    maintainer_can_modify: z.boolean().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/pulls"]["parameters"], "owner" | "repo">>
export type GitHubCreatePullRequestRequest = z.infer<typeof GitHubCreatePullRequestRequestSchema>

export const GitHubUpdatePullRequestRequestSchema = z.object({
    title: z.string().min(1).optional(),
    body: z.string().nullable().optional(),
    state: z.enum(["open", "closed"]).optional(),
    base: z.string().min(1).optional(),
    maintainer_can_modify: z.boolean().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"]["parameters"], "owner" | "repo" | "pull_number">>
export type GitHubUpdatePullRequestRequest = z.infer<typeof GitHubUpdatePullRequestRequestSchema>

@Identifier("GITHUB_CREATE_PULL_REQUEST_REQUEST")
@Name({ code: "en-US", content: "Create GitHub pull request request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request request" })
@Schema(GitHubCreatePullRequestRequestSchema)
export class GitHubCreatePullRequestRequestDataType {}

@Identifier("GITHUB_UPDATE_PULL_REQUEST_REQUEST")
@Name({ code: "en-US", content: "Update GitHub pull request request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub pull request request" })
@Schema(GitHubUpdatePullRequestRequestSchema)
export class GitHubUpdatePullRequestRequestDataType {}
