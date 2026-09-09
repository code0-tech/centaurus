import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubRepositoryBranch, GitHubRepositoryBranchSchema } from "../../data_types/repositories/githubRepositoryBranch.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getRepositoryBranches")
@Signature("(owner: string, repository: string, page?: number, perPage?: number): GITHUB_REPOSITORY_BRANCH[]")
@Name({ code: "en-US", content: "Get repository branches" })
@DisplayMessage({ code: "en-US", content: "Get GitHub repository branches" })
@Documentation({ code: "en-US", content: "Returns branches of a GitHub repository." })
@Description({ code: "en-US", content: "Returns GitHub repository branches." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
export class GetRepositoryBranchesFunction {
    async run(context: FunctionContext, owner: string, repository: string, page = 1, perPage = 30): Promise<GitHubRepositoryBranch[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/branches`, {
                params: { page, per_page: perPage },
            })
            return GitHubRepositoryBranchSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
