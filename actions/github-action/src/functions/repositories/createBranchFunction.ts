import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubCreateBranchRequest } from "../../data_types/repositories/githubBranchRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createBranch")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_BRANCH_REQUEST): void")
@Name({ code: "en-US", content: "Create branch" })
@DisplayMessage({ code: "en-US", content: "Create GitHub branch" })
@Documentation({ code: "en-US", content: "Creates a GitHub branch from a commit SHA." })
@Description({ code: "en-US", content: "Creates a GitHub branch." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Branch" }] })
export class CreateBranchFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreateBranchRequest): Promise<void> {
        try {
            const client = createGitHubClient(context)
            await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/refs`, {
                ref: `refs/heads/${data.branch}`,
                sha: data.sha,
            })
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
