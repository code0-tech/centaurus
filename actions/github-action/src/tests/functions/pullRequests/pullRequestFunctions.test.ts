import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { ClosePullRequestFunction } from "../../../functions/pullRequests/closePullRequestFunction.js"
import { CreatePullRequestFunction } from "../../../functions/pullRequests/createPullRequestFunction.js"
import { GetPullRequestFunction } from "../../../functions/pullRequests/getPullRequestFunction.js"
import { GetPullRequestsFunction } from "../../../functions/pullRequests/getPullRequestsFunction.js"
import { ReopenPullRequestFunction } from "../../../functions/pullRequests/reopenPullRequestFunction.js"
import { UpdatePullRequestFunction } from "../../../functions/pullRequests/updatePullRequestFunction.js"

vi.mock("axios")

describe("pull request functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets a pull request", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { id: 1 } })

        await new GetPullRequestFunction().run(createMockContext(), "owner", "repo", 5)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/pulls/5")
    })

    it("gets pull requests with pagination", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        await new GetPullRequestsFunction().run(createMockContext(), "owner", "repo", "closed", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/pulls", {
            params: { state: "closed", page: 2, per_page: 10 },
        })
    })

    it("creates a pull request", async () => {
        const data = { title: "PR", head: "feature", base: "main" }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new CreatePullRequestFunction().run(createMockContext(), "owner", "repo", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/pulls", data)
    })

    it("updates a pull request", async () => {
        const data = { title: "Updated" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 1 } })

        await new UpdatePullRequestFunction().run(createMockContext(), "owner", "repo", 5, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/pulls/5", data)
    })

    it("closes and reopens a pull request", async () => {
        mockGitHubClient.patch.mockResolvedValue({ data: { id: 1 } })

        await new ClosePullRequestFunction().run(createMockContext(), "owner", "repo", 5)
        await new ReopenPullRequestFunction().run(createMockContext(), "owner", "repo", 5)

        expect(mockGitHubClient.patch).toHaveBeenNthCalledWith(1, "/repos/owner/repo/pulls/5", { state: "closed" })
        expect(mockGitHubClient.patch).toHaveBeenNthCalledWith(2, "/repos/owner/repo/pulls/5", { state: "open" })
    })

    it("rejects invalid pull request numbers", async () => {
        await expect(new GetPullRequestFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
