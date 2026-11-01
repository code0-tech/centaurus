import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubLabel, GitHubLabelSchema } from "../../data_types/labels/githubLabel.js"
import { GitHubLabelReference } from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, labelName } from "../../helpers.js"

@Identifier("removeLabelFromIssue")
@Signature("(owner: string, repository: string, issueNumber: number, label: GITHUB_LABEL_REFERENCE): GITHUB_LABEL[]")
@Name({ code: "en-US", content: "Remove label from issue" })
@DisplayMessage({ code: "en-US", content: "Remove GitHub issue label" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Removes a label from a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Removes a GitHub issue label." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
@Parameter({ runtimeName: "label", name: [{ code: "en-US", content: "Label" }], description: [{ code: "en-US", content: "Name of the label." }] })
export class RemoveLabelFromIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, label: GitHubLabelReference): Promise<GitHubLabel[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.delete(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels/${encodeURIComponent(labelName(label))}`
            )
            return GitHubLabelSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
