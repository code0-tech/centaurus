import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubLabel, GitHubLabelSchema } from "../../data_types/labels/githubLabel.js"
import { GitHubIssueLabelsRequest } from "../../data_types/labels/githubLabelRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("addLabelsToIssue")
@Signature("(owner: string, repository: string, issueNumber: number, data: GITHUB_ISSUE_LABELS_REQUEST): GITHUB_LABEL[]")
@Name({ code: "en-US", content: "Add labels to issue" })
@DisplayMessage({ code: "en-US", content: "Add GitHub issue labels" })
@Documentation({ code: "en-US", content: "Adds labels to a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Adds GitHub issue labels." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Labels" }] })
export class AddLabelsToIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, data: GitHubIssueLabelsRequest): Promise<GitHubLabel[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels`, data)
            return GitHubLabelSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
