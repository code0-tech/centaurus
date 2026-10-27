import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("deleteMilestone")
@Signature("(owner: string, repository: string, milestoneNumber: number): void")
@Name({ code: "en-US", content: "Delete milestone" })
@DisplayMessage({ code: "en-US", content: "Delete GitHub milestone" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Deletes a GitHub milestone." })
@Description({ code: "en-US", content: "Deletes a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "milestoneNumber", name: [{ code: "en-US", content: "Milestone number" }], description: [{ code: "en-US", content: "Number of the milestone." }] })
export class DeleteMilestoneFunction {
    async run(context: FunctionContext, owner: string, repository: string, milestoneNumber: number): Promise<void> {
        if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_MILESTONE_NUMBER", "Milestone number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            await client.delete(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones/${milestoneNumber}`)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
