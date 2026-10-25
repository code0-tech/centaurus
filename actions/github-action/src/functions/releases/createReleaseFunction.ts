import { Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules"
import { GitHubRelease, GitHubReleaseSchema } from "../../data_types/releases/githubRelease.js"
import { createGitHubClient, handleGitHubError, requestBody } from "../../helpers.js"

@Identifier("createRelease")
@Signature(
    '(owner: string, repository: string, tagName: string, name?: string, body?: string, targetCommitish?: string, draft?: boolean, prerelease?: boolean, generateReleaseNotes?: boolean, discussionCategoryName?: string, makeLatest?: "true"|"false"|"legacy"): GITHUB_RELEASE'
)
@Name({ code: "en-US", content: "Create release" })
@DisplayMessage({ code: "en-US", content: "Create GitHub release" })
@DisplayIcon("tabler:brand-github")
@Documentation({ code: "en-US", content: "Creates a GitHub release." })
@Description({ code: "en-US", content: "Creates a GitHub release." })
@Parameter({ runtimeName: "owner", name: [{ code: "en-US", content: "Owner" }], description: [{ code: "en-US", content: "Repository owner or organization." }] })
@Parameter({ runtimeName: "repository", name: [{ code: "en-US", content: "Repository" }], description: [{ code: "en-US", content: "Repository name." }] })
@Parameter({ runtimeName: "tagName", name: [{ code: "en-US", content: "Tag" }], description: [{ code: "en-US", content: "Name of the tag for the release." }] })
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
    description: [{ code: "en-US", content: "Branch or commit the tag is created from. Defaults to the default branch." }],
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
    runtimeName: "generateReleaseNotes",
    name: [{ code: "en-US", content: "Generate release notes" }],
    description: [{ code: "en-US", content: "Whether GitHub generates the release notes automatically." }],
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
export class CreateReleaseFunction {
    async run(
        context: FunctionContext,
        owner: string,
        repository: string,
        tagName: string,
        name?: string,
        body?: string,
        targetCommitish?: string,
        draft?: boolean,
        prerelease?: boolean,
        generateReleaseNotes?: boolean,
        discussionCategoryName?: string,
        makeLatest?: "true" | "false" | "legacy"
    ): Promise<GitHubRelease> {
        try {
            const client = createGitHubClient(context)
            const response = await client.post(
                `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases`,
                requestBody({
                    tag_name: tagName,
                    name,
                    body,
                    target_commitish: targetCommitish,
                    draft,
                    prerelease,
                    generate_release_notes: generateReleaseNotes,
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
