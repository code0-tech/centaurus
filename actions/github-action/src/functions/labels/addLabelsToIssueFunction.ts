import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubLabel, GitHubLabelSchema } from "../../data_types/labels/githubLabel.js"
import { GitHubLabelReference } from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, labelName } from "../../helpers.js"

@Identifier("addLabelsToIssue")
@Signature("(owner: string, repository: string, issueNumber: number, labels: GITHUB_LABEL_REFERENCE[]): GITHUB_LABEL[]")
@Name({ code: "en-US", content: "Add labels to issue" })
@DisplayMessage({ code: "en-US", content: "Add GitHub issue labels" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Adds labels to a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Adds GitHub issue labels." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
@Parameter({ runtimeName: "labels", name: [{ code: "en-US", content: "Labels" }], description: [{ code: "en-US", content: "Names of the labels to add to the issue." }] })
export class AddLabelsToIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, labels: GitHubLabelReference[]): Promise<GitHubLabel[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels`, { labels: labels.map(labelName) })
            return GitHubLabelSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
