import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("getMilestone")
@Signature("(owner: string, repository: string, milestoneNumber: number): GITHUB_MILESTONE")
@Name({ code: "en-US", content: "Get milestone" })
@DisplayMessage({ code: "en-US", content: "Get GitHub milestone" })
@Documentation({ code: "en-US", content: "Returns a GitHub milestone." })
@Description({ code: "en-US", content: "Returns a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "milestoneNumber", name: [{ code: "en-US", content: "Milestone number" }] })
export class GetMilestoneFunction {
    async run(context: FunctionContext, owner: string, repository: string, milestoneNumber: number): Promise<GitHubMilestone> {
        if (!Number.isInteger(milestoneNumber) || milestoneNumber < 1)
            throw new RuntimeError("GITHUB_INVALID_MILESTONE_NUMBER", "Milestone number must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones/${milestoneNumber}`)
            return GitHubMilestoneSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
