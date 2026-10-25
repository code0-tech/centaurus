import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"
import { schemas } from "../../generated/github-schemas.js"
import { GitHubCommitSchema } from "./githubCommit.js"

export const GitHubRepositoryBranchSchema = schemas["branch-with-protection"]
export type GitHubRepositoryBranch = z.infer<typeof GitHubRepositoryBranchSchema>

@Identifier("GITHUB_REPOSITORY_BRANCH")
@Name({ code: "en-US", content: "GitHub repository branch" })
@DisplayMessage({ code: "en-US", content: "GitHub repository branch" })
@Schema(GitHubRepositoryBranchSchema)
export class GitHubRepositoryBranchDataType {}

/** The branch list endpoint returns fewer fields than the single branch endpoint. */
export const GitHubRepositoryBranchSummarySchema = schemas["short-branch"]
export type GitHubRepositoryBranchSummary = z.infer<typeof GitHubRepositoryBranchSummarySchema>

@Identifier("GITHUB_REPOSITORY_BRANCH_SUMMARY")
@Name({ code: "en-US", content: "GitHub repository branch summary" })
@DisplayMessage({ code: "en-US", content: "GitHub repository branch summary" })
@Schema(GitHubRepositoryBranchSummarySchema)
export class GitHubRepositoryBranchSummaryDataType {}
