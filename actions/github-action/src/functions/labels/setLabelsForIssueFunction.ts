import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubLabel, GitHubLabelSchema } from "../../data_types/labels/githubLabel.js"
import { GitHubLabelReference } from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, labelName } from "../../helpers.js"

@Identifier("setLabelsForIssue")
@Signature("(owner: string, repository: string, issueNumber: number, labels: GITHUB_LABEL_REFERENCE[]): GITHUB_LABEL[]")
@Name({ code: "en-US", content: "Set labels for issue" })
@DisplayMessage({ code: "en-US", content: "Set GitHub issue labels" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Replaces all labels for a GitHub issue or pull request." })
@Description({ code: "en-US", content: "Sets GitHub issue labels." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
@Parameter({ runtimeName: "labels", name: [{ code: "en-US", content: "Labels" }], description: [{ code: "en-US", content: "Label names that replace the ones on the issue." }] })
export class SetLabelsForIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, labels: GitHubLabelReference[]): Promise<GitHubLabel[]> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.put(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/labels`, { labels: labels.map(labelName) })
            return GitHubLabelSchema.array().parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
