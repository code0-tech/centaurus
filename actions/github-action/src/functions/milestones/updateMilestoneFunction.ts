import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("updateMilestone")
@Signature(
    '(owner: string, repository: string, milestoneNumber: number, title?: string, description?: string, dueOn?: string, state?: "open"|"closed"): GITHUB_MILESTONE'
)
@Name({ code: "en-US", content: "Update milestone" })
@DisplayMessage({ code: "en-US", content: "Update GitHub milestone" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Updates a GitHub milestone. Fields that are left empty keep their current value." })
@Description({ code: "en-US", content: "Updates a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "milestoneNumber", name: [{ code: "en-US", content: "Milestone number" }], description: [{ code: "en-US", content: "Number of the milestone." }] })
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "New title of the milestone." }],
    optional: true,
})
@Parameter({
    runtimeName: "description",
    name: [{ code: "en-US", content: "Description" }],
    description: [{ code: "en-US", content: "New description of the milestone." }],
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
export class UpdateMilestoneFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        milestoneNumber: number,
        title?: string,
        description?: string,
        dueOn?: string,
        state?: "open" | "closed"
    ): Promise<GitHubMilestone> {
        if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_MILESTONE_NUMBER", "Milestone number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones/${milestoneNumber}`,
                requestBody({ title, description, due_on: dueOn, state })
            )
            return GitHubMilestoneSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
