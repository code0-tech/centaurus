import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { GitHubUpdateMilestoneRequest } from "../../data_types/milestones/githubMilestoneRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("updateMilestone")
@Signature("(owner: string, repository: string, milestoneNumber: number, data: GITHUB_UPDATE_MILESTONE_REQUEST): GITHUB_MILESTONE")
@Name({ code: "en-US", content: "Update milestone" })
@DisplayMessage({ code: "en-US", content: "Update GitHub milestone" })
@Documentation({ code: "en-US", content: "Updates a GitHub milestone." })
@Description({ code: "en-US", content: "Updates a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "milestoneNumber", name: [{ code: "en-US", content: "Milestone number" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Milestone updates" }] })
export class UpdateMilestoneFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        milestoneNumber: number,
        data: GitHubUpdateMilestoneRequest
    ): Promise<GitHubMilestone> {
        if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_MILESTONE_NUMBER", "Milestone number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones/${milestoneNumber}`, data)
            return GitHubMilestoneSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
