import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules"
import { z } from "zod"

export const GitHubCreateBranchRequestSchema = z.object({
    branch: z.string().min(1),
    sha: z.string().min(1),
})
export type GitHubCreateBranchRequest = z.infer<typeof GitHubCreateBranchRequestSchema>

@Identifier("GITHUB_CREATE_BRANCH_REQUEST")
@Name({ code: "en-US", content: "Create GitHub branch request" })
@DisplayMessage({ code: "en-US", content: "Create GitHub branch request" })
@Schema(GitHubCreateBranchRequestSchema)
export class GitHubCreateBranchRequestDataType {}
