import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import { GitHubUserReference } from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, userLogin } from "../../helpers.js"

@Identifier("addAssigneesToIssue")
@Signature("(owner: string, repository: string, issueNumber: number, assignees: GITHUB_USER_REFERENCE[]): GITHUB_ISSUE")
@Name({ code: "en-US", content: "Add assignees to issue" })
@DisplayMessage({ code: "en-US", content: "Add GitHub issue assignees" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Adds assignees to a GitHub issue." })
@Description({ code: "en-US", content: "Adds assignees to a GitHub issue." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "issueNumber", name: [{ code: "en-US", content: "Issue number" }], description: [{ code: "en-US", content: "Number of the issue." }] })
@Parameter({ runtimeName: "assignees", name: [{ code: "en-US", content: "Assignees" }], description: [{ code: "en-US", content: "Usernames to assign to the issue." }] })
export class AddAssigneesToIssueFunction {
    async run(context: FunctionContext, owner: string, repository: string, issueNumber: number, assignees: GitHubUserReference[]): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}/assignees`, {
                assignees: assignees.map(userLogin),
            })
            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
