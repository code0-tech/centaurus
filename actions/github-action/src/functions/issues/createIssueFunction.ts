import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubIssue, GitHubIssueSchema } from "../../data_types/issues/githubIssue.js"
import {
    GitHubLabelReference,
    GitHubMilestoneReference,
    GitHubUserReference,
} from "../../data_types/references/githubReferences.js"
import { createGitHubClient, handleGitHubError, labelName, milestoneNumber, requestBody, userLogin } from "../../helpers.js"

@Identifier("createIssue")
@Signature(
    "(owner: string, repository: string, title: string, body?: string, assignees?: GITHUB_USER_REFERENCE[], labels?: GITHUB_LABEL_REFERENCE[], milestone?: GITHUB_MILESTONE_REFERENCE, issueType?: string): GITHUB_ISSUE"
)
@Name({ code: "en-US", content: "Create issue" })
@DisplayMessage({ code: "en-US", content: "Create GitHub issue" })
@DisplayIcon("tabler:brand-github")
@Documentation({
    code: "en-US",
    content: "Creates an issue in a GitHub repository.",
})
@Description({
    code: "en-US",
    content: "Creates an issue in a GitHub repository.",
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
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "Title of the issue." }],
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "Description of the issue." }],
    optional: true,
})
@Parameter({
    runtimeName: "assignees",
    name: [{ code: "en-US", content: "Assignees" }],
    description: [{ code: "en-US", content: "Usernames to assign to the issue." }],
    optional: true,
})
@Parameter({
    runtimeName: "labels",
    name: [{ code: "en-US", content: "Labels" }],
    description: [{ code: "en-US", content: "Names of the labels to put on the issue." }],
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
export class CreateIssueFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        title: string,
        body?: string,
        assignees?: GitHubUserReference[],
        labels?: GitHubLabelReference[],
        milestone?: GitHubMilestoneReference,
        issueType?: string
    ): Promise<GitHubIssue> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/issues`,
                requestBody({
                    title,
                    body,
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
