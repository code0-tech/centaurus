import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createMilestone")
@Signature('(owner: string, repository: string, title: string, description?: string, dueOn?: string, state?: "open"|"closed"): GITHUB_MILESTONE')
@Name({ code: "en-US", content: "Create milestone" })
@DisplayMessage({ code: "en-US", content: "Create GitHub milestone" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a GitHub milestone." })
@Description({ code: "en-US", content: "Creates a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "title", name: [{ code: "en-US", content: "Title" }], description: [{ code: "en-US", content: "Title of the milestone." }] })
@Parameter({
    runtimeName: "description",
    name: [{ code: "en-US", content: "Description" }],
    description: [{ code: "en-US", content: "Description of the milestone." }],
    optional: true,
})
@Parameter({
    runtimeName: "dueOn",
    name: [{ code: "en-US", content: "Due date" }],
    description: [{ code: "en-US", content: "Due date of the milestone, as an ISO 8601 timestamp." }],
    optional: true,
})
@Parameter({
    runtimeName: "state",
    name: [{ code: "en-US", content: "State" }],
    description: [{ code: "en-US", content: "Whether the milestone is open or closed." }],
    optional: true,
})
export class CreateMilestoneFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        title: string,
        description?: string,
        dueOn?: string,
        state?: "open" | "closed"
    ): Promise<GitHubMilestone> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones`,
                requestBody({ title, description, due_on: dueOn, state })
            )
            return GitHubMilestoneSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
