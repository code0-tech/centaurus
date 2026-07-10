import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreatePullRequestReviewFunction } from "../../../functions/pullRequestReviews/createPullRequestReviewFunction.js"
import { DismissPullRequestReviewFunction } from "../../../functions/pullRequestReviews/dismissPullRequestReviewFunction.js"
import { GetPullRequestReviewsFunction } from "../../../functions/pullRequestReviews/getPullRequestReviewsFunction.js"
import { SubmitPullRequestReviewFunction } from "../../../functions/pullRequestReviews/submitPullRequestReviewFunction.js"

vi.mock("axios")

describe("pull request review functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets pull request reviews", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        await new GetPullRequestReviewsFunction().run(createMockContext(), "owner", "repo", 5, 2, 20)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/reviews", {
            params: { page: 2, per_page: 20 },
        })
    })

    it("creates a pull request review", async () => {
        const data = { event: "COMMENT" as const, body: "Looks good" }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new CreatePullRequestReviewFunction().run(createMockContext(), "owner", "repo", 5, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/reviews", data)
    })

    it("submits a pull request review", async () => {
        const data = { event: "APPROVE" as const }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new SubmitPullRequestReviewFunction().run(createMockContext(), "owner", "repo", 5, 9, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/reviews/9/events", data)
    })

    it("dismisses a pull request review", async () => {
        const data = { message: "Outdated" }
        mockGitHubClient.put.mockResolvedValueOnce({ data: { id: 1 } })

        await new DismissPullRequestReviewFunction().run(createMockContext(), "owner", "repo", 5, 9, data)

        expect(mockGitHubClient.put).toHaveBeenCalledWith("/repos/owner/repo/pulls/5/reviews/9/dismissals", data)
    })

    it("rejects invalid review ids", async () => {
        await expect(new SubmitPullRequestReviewFunction().run(createMockContext(), "owner", "repo", 5, 0, { event: "COMMENT" })).rejects.toBeInstanceOf(
            RuntimeError
        )
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
