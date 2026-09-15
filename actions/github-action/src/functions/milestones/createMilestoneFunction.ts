import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubMilestone, GitHubMilestoneSchema } from "../../data_types/milestones/githubMilestone.js"
import { GitHubCreateMilestoneRequest } from "../../data_types/milestones/githubMilestoneRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createMilestone")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_MILESTONE_REQUEST): GITHUB_MILESTONE")
@Name({ code: "en-US", content: "Create milestone" })
@DisplayMessage({ code: "en-US", content: "Create GitHub milestone" })
@Documentation({ code: "en-US", content: "Creates a GitHub milestone." })
@Description({ code: "en-US", content: "Creates a GitHub milestone." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Milestone" }] })
export class CreateMilestoneFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreateMilestoneRequest): Promise<GitHubMilestone> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/milestones`, data)
            return GitHubMilestoneSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
