import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssueComment, GitHubIssueCommentSchema } from "../../data_types/issueComments/githubIssueComment.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getIssueComments")
@Signature("(owner: string, repository: string, issueNumber: number, page?: number, perPage?: number): GITHUB_ISSUE_COMMENT[]")
@Name({ code: "en-US", content: "Get issue comments" })
@DisplayMessage({ code: "en-US", content: "Get GitHub issue comments" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Returns comments for an issue or pull request conversation." })
@Description({ code: "en-US", content: "Returns GitHub issue comments." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
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
export class GetIssueCommentsFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, page = 1, perPage = 30): Promise<GitHubIssueComment[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        if (!Number.isInteger(page) || page < 1) throw new RuntimeError("GITHUB_INVALID_PAGE", "Page must be a positive integer.")
        if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100)
            throw new RuntimeError("GITHUB_INVALID_PER_PAGE", "Results per page must be an integer from 1 to 100.")

        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/comments`, {
                params: { page, per_page: perPage },
            })

            return GitHubIssueCommentSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
