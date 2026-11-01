import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubPullRequestReviewComment, GitHubPullRequestReviewCommentSchema } from "../../data_types/pullRequestReviewComments/githubPullRequestReviewComment.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createPullRequestReviewComment")
@Signature(
    '(owner: string, repository: string, pullRequestNumber: number, body: string, commitId: string, path: string, line?: number, side?: "LEFT"|"RIGHT", startLine?: number, startSide?: "LEFT"|"RIGHT", inReplyTo?: number): GITHUB_PULL_REQUEST_REVIEW_COMMENT'
)
@Name({ code: "en-US", content: "Create pull request review comment" })
@DisplayMessage({ code: "en-US", content: "Create GitHub pull request review comment" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a pull request review comment on a line of a file." })
@Description({ code: "en-US", content: "Creates a GitHub pull request review comment." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "pullRequestNumber", name: [{ code: "en-US", content: "Pull request number" }], description: [{ code: "en-US", content: "Number of the pull request." }] })
@Parameter({ runtimeName: "body", name: [{ code: "en-US", content: "Comment" }], description: [{ code: "en-US", content: "Text of the review comment." }] })
@Parameter({ runtimeName: "commitId", name: [{ code: "en-US", content: "Commit SHA" }], description: [{ code: "en-US", content: "Commit the comment refers to." }] })
@Parameter({ runtimeName: "path", name: [{ code: "en-US", content: "File path" }], description: [{ code: "en-US", content: "Path of the file the comment refers to." }] })
@Parameter({
    runtimeName: "line",
    name: [{ code: "en-US", content: "Line" }],
    description: [{ code: "en-US", content: "Line in the file the comment refers to." }],
    optional: true,
})
@Parameter({
    runtimeName: "side",
    name: [{ code: "en-US", content: "Side" }],
    description: [{ code: "en-US", content: "Whether the line is on the old (LEFT) or new (RIGHT) version of the file." }],
    optional: true,
})
@Parameter({
    runtimeName: "startLine",
    name: [{ code: "en-US", content: "Start line" }],
    description: [{ code: "en-US", content: "First line of a multi-line comment." }],
    optional: true,
})
@Parameter({
    runtimeName: "startSide",
    name: [{ code: "en-US", content: "Start side" }],
    description: [{ code: "en-US", content: "Side of the first line of a multi-line comment." }],
    optional: true,
})
@Parameter({
    runtimeName: "inReplyTo",
    name: [{ code: "en-US", content: "In reply to" }],
    description: [{ code: "en-US", content: "Identifier of the review comment this one replies to." }],
    optional: true,
})
export class CreatePullRequestReviewCommentFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        pullRequestNumber: number,
        body: string,
        commitId: string,
        path: string,
        line?: number,
        side?: "LEFT" | "RIGHT",
        startLine?: number,
        startSide?: "LEFT" | "RIGHT",
        inReplyTo?: number
    ): Promise<GitHubPullRequestReviewComment> {
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_PULL_REQUEST_NUMBER", "Pull request number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullRequestNumber}/comments`,
                requestBody({ body, commit_id: commitId, path, line, side, start_line: startLine, start_side: startSide, in_reply_to: inReplyTo })
            )
            return GitHubPullRequestReviewCommentSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
