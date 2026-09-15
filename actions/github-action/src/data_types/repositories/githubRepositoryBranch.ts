import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import type { Endpoints } from "@octokit/types"
import { z } from "zod"

export const GitHubRepositoryBranchSchema = z.looseObject({}) as unknown as z.ZodType<
    Endpoints["GET /repos/{owner}/{repo}/branches/{branch}"]["response"]["data"]
>
export type GitHubRepositoryBranch = z.infer<typeof GitHubRepositoryBranchSchema>

@Identifier("GITHUB_REPOSITORY_BRANCH")
@Name({ code: "en-US", content: "GitHub repository branch" })
@DisplayMessage({ code: "en-US", content: "GitHub repository branch" })
@Schema(GitHubRepositoryBranchSchema)
export class GitHubRepositoryBranchDataType {}
