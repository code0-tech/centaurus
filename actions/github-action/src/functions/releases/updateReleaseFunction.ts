import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, RuntimeError, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("updateRelease")
@Signature(
    '(owner: string, repository: string, releaseId: number, tagName?: string, name?: string, body?: string, targetCommitish?: string, draft?: boolean, prerelease?: boolean, discussionCategoryName?: string, makeLatest?: "true"|"false"|"legacy"): GITHUB_RELEASE'
)
@Name({ code: "en-US", content: "Update release" })
@DisplayMessage({ code: "en-US", content: "Update GitHub release" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Updates a GitHub release. Fields that are left empty keep their current value." })
@Description({ code: "en-US", content: "Updates a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "releaseId", name: [{ code: "en-US", content: "Release ID" }], description: [{ code: "en-US", content: "Identifier of the release." }] })
@Parameter({
    runtimeName: "tagName",
    name: [{ code: "en-US", content: "Tag" }],
    description: [{ code: "en-US", content: "Name of the tag for the release." }],
    optional: true,
})
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
    description: [{ code: "en-US", content: "Title of the release." }],
    optional: true,
})
@Parameter({
    runtimeName: "body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "Release notes." }],
    optional: true,
})
@Parameter({
    runtimeName: "targetCommitish",
    name: [{ code: "en-US", content: "Target" }],
    description: [{ code: "en-US", content: "Branch or commit the tag points at." }],
    optional: true,
})
@Parameter({
    runtimeName: "draft",
    name: [{ code: "en-US", content: "Draft" }],
    description: [{ code: "en-US", content: "Whether the release is kept as an unpublished draft." }],
    optional: true,
})
@Parameter({
    runtimeName: "prerelease",
    name: [{ code: "en-US", content: "Pre-release" }],
    description: [{ code: "en-US", content: "Whether the release is marked as a pre-release." }],
    optional: true,
})
@Parameter({
    runtimeName: "discussionCategoryName",
    name: [{ code: "en-US", content: "Discussion category" }],
    description: [{ code: "en-US", content: "Name of the discussion category a release discussion is created in." }],
    optional: true,
})
@Parameter({
    runtimeName: "makeLatest",
    name: [{ code: "en-US", content: "Mark as latest" }],
    description: [{ code: "en-US", content: "Whether the release is marked as the latest one." }],
    optional: true,
})
export class UpdateReleaseFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        releaseId: number,
        tagName?: string,
        name?: string,
        body?: string,
        targetCommitish?: string,
        draft?: boolean,
        prerelease?: boolean,
        discussionCategoryName?: string,
        makeLatest?: "true" | "false" | "legacy"
    ): Promise<GitHubRelease> {
        if (!Number.isInteger(releaseId) || releaseId < 1) throw new RuntimeError("GITHUB_INVALID_RELEASE_ID", "Release ID must be a positive integer.")
        try {
            const client = createGitHubClient(context)
            const response = await client.patch(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/${releaseId}`,
                requestBody({
                    tag_name: tagName,
                    name,
                    body,
                    target_commitish: targetCommitish,
                    draft,
                    prerelease,
                    discussion_category_name: discussionCategoryName,
                    make_latest: makeLatest,
                })
            )
            return GitHubReleaseSchema.parse(response.data)
        } catch (error) {
            return handleGitHubError(error)
        }
    }
}
