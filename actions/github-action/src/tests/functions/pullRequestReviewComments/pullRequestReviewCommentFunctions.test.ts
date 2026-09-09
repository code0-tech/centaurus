import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreatePullRequestReviewCommentFunction } from "../../../functions/pullRequestReviewComments/createPullRequestReviewCommentFunction.js"
import { DeletePullRequestReviewCommentFunction } from "../../../functions/pullRequestReviewComments/deletePullRequestReviewCommentFunction.js"
import { GetPullRequestReviewCommentsFunction } from "../../../functions/pullRequestReviewComments/getPullRequestReviewCommentsFunction.js"
import { UpdatePullRequestReviewCommentFunction } from "../../../functions/pullRequestReviewComments/updatePullRequestReviewCommentFunction.js"

vi.mock("axios")

describe("pull request review comment functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets pull request review comments", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        await new GetPullRequestReviewCommentsFunction().run(createMockContext(), "owner", "repo", 5, 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/comments", {
            params: { page: 2, per_page: 10 },
        })
    })

    it("creates a pull request review comment", async () => {
        const data = { body: "Inline", commit_id: "abc", path: "file.ts", line: 1 }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new CreatePullRequestReviewCommentFunction().run(createMockContext(), "owner", "repo", 5, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/comments", data)
    })

    it("updates a pull request review comment", async () => {
        const data = { body: "Updated" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 9 } })

        await new UpdatePullRequestReviewCommentFunction().run(createMockContext(), "owner", "repo", 9, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/pulls/comments/9", data)
    })

    it("deletes a pull request review comment", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new DeletePullRequestReviewCommentFunction().run(createMockContext(), "owner", "repo", 9)

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/pulls/comments/9")
    })

    it("rejects invalid comment ids", async () => {
        await expect(new DeletePullRequestReviewCommentFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
