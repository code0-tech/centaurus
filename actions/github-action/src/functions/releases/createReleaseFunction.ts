import { Description, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { GitHubCreateReleaseRequest } from "../../data_types/releases/githubReleaseRequests.js"
import { createGitHubClient, handleGitHubError } from "../../helpers.js"

@Identifier("createRelease")
@Signature("(owner: string, repository: string, data: GITHUB_CREATE_RELEASE_REQUEST): GITHUB_RELEASE")
@Name({ code: "en-US", content: "Create release" })
@DisplayMessage({ code: "en-US", content: "Create GitHub release" })
@Documentation({ code: "en-US", content: "Creates a GitHub release." })
@Description({ code: "en-US", content: "Creates a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }] })
@Parameter({ runtimeName: "data", name: [{ code: "en-US", content: "Release" }] })
export class CreateReleaseFunction {
    async run(context: FunctionContext, owner: string, repository: string, data: GitHubCreateReleaseRequest): Promise<GitHubRelease> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases`, data)
            return GitHubReleaseSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
