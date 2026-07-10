import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubCommit, GitHubCommitSchema } from "../../data_types/repositories/githubCommit.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getCommits")
@Signature("(owner: string, repository: string, sha?: string, page?: number, perPage?: number): GITHUB_COMMIT[]")
@Name({ code: "en-US", content: "Get commits" })
@DisplayMessage({ code: "en-US", content: "Get GitHub commits" })
@Documentation({ code: "en-US", content: "Returns commits from a GitHub repository." })
@Description({ code: "en-US", content: "Returns GitHub commits." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "sha", name: [{ code: "en-US", content: "SHA or branch" }] })
export class GetCommitsFunction {
    async run(context: FunctionContext, owner: string, repository: string, sha?: string, page = 1, perPage = 30): Promise<GitHubCommit[]> {
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits`, {
                params: { sha, page, per_page: perPage },
            })
            return GitHubCommitSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
