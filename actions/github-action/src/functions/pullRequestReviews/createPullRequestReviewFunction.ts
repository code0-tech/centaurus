import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReview, GitHubPullRequestReviewSchema } from "../../data_types/pullRequestReviews/githubPullRequestReview.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createPullRequestReview")
@Signature(
    '(owner: string, repository: string, pullRequestNumber: number, event?: "APPROVE"|"REQUEST_CHANGES"|"COMMENT", body?: string, commitId?: string): GITHUB_PULL_REQUEST_REVIEW'
)
@Name({ code: "en-US", content: "Create pull request review" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request review" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a pull request review. Without an event the review stays pending until it is submitted." })
@Description({ code: "en-US", content: "Creates a GitHub pull request review." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({
    runtimeName: "event",
    name: [{ code: "en-US", content: "Event" }],
    description: [{ code: "en-US", content: "Whether the review approves, requests changes, or only comments." }],
    optional: true,
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "Text of the review." }],
    optional: true,
})
@Parameter({
    runtimeName: "commitId",
    name: [{ code: "en-US", content: "Commit SHA" }],
    description: [{ code: "en-US", content: "Commit the review refers to. Defaults to the latest commit." }],
    optional: true,
})
export class CreatePullRequestReviewFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        event?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
        body?: string,
        commitId?: string
    ): Promise<GitHubPullRequestReview> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")

        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/reviews`,
                requestBody({ event, body, commit_id: commitId })
            )
            return GitHubPullRequestReviewSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
