import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubLabel, GitHubLabelSchema } from "../../data_types/labels/githubLabel.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getIssueLabels")
@Signature("(owner: string, repository: string, issueNumber: number): GITHUB_LABEL[]")
@Name({ code: "en-US", content: "Get issue labels" })
@DisplayMessage({ code: "en-US", content: "Get GitHub issue labels" })
@Documentation({ code: "en-US", content: "Returns labels for a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Returns GitHub issue labels." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }] })
export class GetIssueLabelsFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number): Promise<GitHubLabel[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels`)
            return GitHubLabelSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
