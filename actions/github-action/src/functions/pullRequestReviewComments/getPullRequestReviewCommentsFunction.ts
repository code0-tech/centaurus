import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReviewComment, GitHubPullRequestReviewCommentSchema } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getPullRequestReviewComments")
@Signature("(owner: string, repository: string, pullRequestNumber: number, page?: number, perPage?: number): GITHUB_PULL_REQUEST_REVIEW_COMMENT[]")
@Name({ code: "en-US", content: "Get pull request review comments" })
@DisplayMessage({ code: "en-US", content: "Get GitHub pull request review comments" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns review comments for a pull request." })
@Description({ code: "en-US", content: "Returns GitHub pull request review comments." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({
    runtimeName: "page",
    name: [{ code: "en-US", content: "Page" }],
    description: [{ code: "en-US", content: "Page number to return. Defaults to 1." }],
    optional: true,
    defaultValue: 1,
})
@Parameter({
    runtimeName: "perPage",
    name: [{ code: "en-US", content: "Results per page" }],
    description: [{ code: "en-US", content: "Number of results per page, from 1 to 100. Defaults to 30." }],
    optional: true,
    defaultValue: 30,
})
export class GetPullRequestReviewCommentsFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        page = 1,
        perPage = 30
    ): Promise<GitHubPullRequestReviewComment[]> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/comments`, {
                params: { page, per_page: perPage },
            })
            return GitHubPullRequestReviewCommentSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
