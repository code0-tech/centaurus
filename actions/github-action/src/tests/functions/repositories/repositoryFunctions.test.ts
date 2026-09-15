import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { DeleteBranchFunction } from "../../../functions/repositories/deleteBranchFunction.js"
import { GetBranchFunction } from "../../../functions/repositories/getBranchFunction.js"
import { GetCommitFunction } from "../../../functions/repositories/getCommitFunction.js"
import { GetCommitsFunction } from "../../../functions/repositories/getCommitsFunction.js"
import { GetRepositoryBranchesFunction } from "../../../functions/repositories/getRepositoryBranchesFunction.js"
import { GetRepositoryFunction } from "../../../functions/repositories/getRepositoryFunction.js"

vi.mock("axios")

describe("repository functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets a repository", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { id: 1 } })

        await new GetRepositoryFunction().run(createMockContext(), "owner", "repo")

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo")
    })

    it("gets repository branches", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ name: "main" }] })

        await new GetRepositoryBranchesFunction().run(createMockContext(), "owner", "repo", 2, 20)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/branches", {
            params: { page: 2, per_page: 20 },
        })
    })

    it("gets a branch", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { name: "feature/test" } })

        await new GetBranchFunction().run(createMockContext(), "owner", "repo", "feature/test")

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/branches/feature%2Ftest")
    })

    it("gets commits", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ sha: "abc" }] })

        await new GetCommitsFunction().run(createMockContext(), "owner", "repo", "main", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/commits", {
            params: { sha: "main", page: 2, per_page: 10 },
        })
    })

    it("gets a commit", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { sha: "abc" } })

        await new GetCommitFunction().run(createMockContext(), "owner", "repo", "abc/123")

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/commits/abc%2F123")
    })

    it("deletes a branch", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new DeleteBranchFunction().run(createMockContext(), "owner", "repo", "feature/test")

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/git/refs/heads%2Ffeature%2Ftest")
    })

    it("rejects invalid branch pagination", async () => {
        await expect(new GetRepositoryBranchesFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
