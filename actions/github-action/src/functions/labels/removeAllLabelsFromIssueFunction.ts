import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("removeAllLabelsFromIssue")
@Signature("(owner: string, repository: string, issueNumber: number): void")
@Name({ code: "en-US", content: "Remove all labels from issue" })
@DisplayMessage({ code: "en-US", content: "Remove all GitHub issue labels" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Removes all labels from a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Removes all GitHub issue labels." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
export class RemoveAllLabelsFromIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number): Promise<void> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
