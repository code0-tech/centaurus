import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubCreateReleaseRequestSchema = z.object({
    tag_name: z.string().min(1),
    target_commitish: z.string().optional(),
    name: z.string().optional(),
    body: z.string().optional(),
    draft: z.boolean().optional(),
    prerelease: z.boolean().optional(),
    generate_release_notes: z.boolean().optional(),
}) as unknown as z.ZodType<Omit<Endpoints["POST /repos/{owner}/{repo}/releases"]["parameters"], "owner" | "repo">>
export type GitHubCreateReleaseRequest = z.infer<typeof GitHubCreateReleaseRequestSchema>

export const GitHubUpdateReleaseRequestSchema = z.object({
    tag_name: z.string().min(1).optional(),
    target_commitish: z.string().optional(),
    name: z.string().optional(),
    body: z.string().optional(),
    draft: z.boolean().optional(),
    prerelease: z.boolean().optional(),
    make_latest: z.enum(["true", "false", "legacy"]).optional(),
}) as unknown as z.ZodType<Omit<Endpoints["PATCH /repos/{owner}/{repo}/releases/{release_id}"]["parameters"], "owner" | "repo" | "release_id">>
export type GitHubUpdateReleaseRequest = z.infer<typeof GitHubUpdateReleaseRequestSchema>

@Identifier("GITHUB_CREATE_RELEASE_REQUEST")
@Name({ code: "en-US", content: "Create GitHub release request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub release request" })
@Schema(GitHubCreateReleaseRequestSchema)
export class GitHubCreateReleaseRequestDataType {}

@Identifier("GITHUB_UPDATE_RELEASE_REQUEST")
@Name({ code: "en-US", content: "Update GitHub release request" })
@DisplayMessage({ code: "en-US", content: "Update GitHub release request" })
@Schema(GitHubUpdateReleaseRequestSchema)
export class GitHubUpdateReleaseRequestDataType {}
