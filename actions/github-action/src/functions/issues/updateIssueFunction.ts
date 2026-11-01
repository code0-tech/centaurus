import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import {
    GitHubLabelReference,
    GitHubMilestoneReference,
    GitHubUserReference,
} from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, labelName, milestoneNumber, requestBody, userLogin } from "../../helpers.js"

@Identifier("updateIssue")
@Signature(
    '(owner: string, repository: string, issueNumber: number, title?: string, body?: string, state?: "open"|"closed", stateReason?: "completed"|"not_planned"|"duplicate"|"reopened", assignees?: GITHUB_USER_REFERENCE[], labels?: GITHUB_LABEL_REFERENCE[], milestone?: GITHUB_MILESTONE_REFERENCE, issueType?: string): GITHUB_ISSUE'
)
@Name({ code: "en-US", content: "Update issue" })
@DisplayMessage({ code: "en-US", content: "Update GitHub issue" })
@DisplayIcon("tabler:brand-github")
@Documentation({
    code: "en-US",
    content: "Updates or closes an issue in a GitHub repository. Fields that are left empty keep their current value.",
})
@Description({
    code: "en-US",
    content: "Updates an issue in a GitHub repository.",
})
@Parameter({
    runtimeName: "owner",
    name: [{ code: "en-US", content: "Owner" }],
    description: [{ code: "en-US", content: "Repository owner or organization." }],
})
@Parameter({
    runtimeName: "repository",
    name: [{ code: "en-US", content: "Repository" }],
    description: [{ code: "en-US", content: "Repository name." }],
})
@Parameter({
    runtimeName: "issueNumber",
    name: [{ code: "en-US", content: "Issue number" }],
    description: [{ code: "en-US", content: "Repository-local issue number." }],
})
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "New title of the issue." }],
    optional: true,
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "New description of the issue." }],
    optional: true,
})
@Parameter({
    runtimeName: "state",
    name: [{ code: "en-US", content: "State" }],
    description: [{ code: "en-US", content: "Whether the issue is open or closed." }],
    optional: true,
})
@Parameter({
    runtimeName: "stateReason",
    name: [{ code: "en-US", content: "State reason" }],
    description: [{ code: "en-US", content: "Why the issue was closed or reopened." }],
    optional: true,
})
@Parameter({
    runtimeName: "assignees",
    name: [{ code: "en-US", content: "Assignees" }],
    description: [{ code: "en-US", content: "Usernames that replace the current assignees." }],
    optional: true,
})
@Parameter({
    runtimeName: "labels",
    name: [{ code: "en-US", content: "Labels" }],
    description: [{ code: "en-US", content: "Label names that replace the current labels." }],
    optional: true,
})
@Parameter({
    runtimeName: "milestone",
    name: [{ code: "en-US", content: "Milestone" }],
    description: [{ code: "en-US", content: "Number of the milestone the issue belongs to." }],
    optional: true,
})
@Parameter({
    runtimeName: "issueType",
    name: [{ code: "en-US", content: "Issue type" }],
    description: [{ code: "en-US", content: "Name of the issue type, if the repository uses issue types." }],
    optional: true,
})
export class UpdateIssueFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        issueNumber: number,
        title?: string,
        body?: string,
        state?: "open" | "closed",
        stateReason?: "completed" | "not_planned" | "duplicate" | "reopened",
        assignees?: GitHubUserReference[],
        labels?: GitHubLabelReference[],
        milestone?: GitHubMilestoneReference,
        issueType?: string
    ): Promise<GitHubIssue> {
        if (!Number.isInteger(issueNumber) || issueNumber < 1) {
            throw new RuntimeError("GITHUB_INVALID_ISSUE_NUMBER", "Issue number must be a positive integer.")
        }

        try {
            const client = createGitHubClient(context)
            const response = await client.patch(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues/${issueNumber}`,
                requestBody({
                    title,
                    body,
                    state,
                    state_reason: stateReason,
                    assignees: assignees?.map(userLogin),
                    labels: labels?.map(labelName),
                    milestone: milestoneNumber(milestone),
                    type: issueType,
                })
            )

            return GitHubIssueSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
