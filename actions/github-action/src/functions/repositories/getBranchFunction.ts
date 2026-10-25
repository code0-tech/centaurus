import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubRepositoryBranch, GitHubRepositoryBranchSchema } from "../../data_types/repositories/githubRepositoryBranch.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getBranch")
@Signature("(owner: string, repository: string, branch: string): GITHUB_REPOSITORY_BRANCH")
@Name({ code: "en-US", content: "Get branch" })
@DisplayMessage({ code: "en-US", content: "Get GitHub branch" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns a branch from a GitHub repository." })
@Description({ code: "en-US", content: "Returns a GitHub branch." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "branch", name: [{ code: "en-US", content: "Branch" }], description: [{ code: "en-US", content: "Name of the branch." }] })
export class GetBranchFunction {
    async run(context: FunctionContext, owner: string, repository: string, branch: string): Promise<GitHubRepositoryBranch> {
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/branches/${encodeURIComponent(branch)}`)
            return GitHubRepositoryBranchSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
