import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { DeleteReleaseFunction } from "../../../functions/releases/deleteReleaseFunction.js"
import { GetReleaseFunction } from "../../../functions/releases/getReleaseFunction.js"
import { GetReleasesFunction } from "../../../functions/releases/getReleasesFunction.js"
import { UpdateReleaseFunction } from "../../../functions/releases/updateReleaseFunction.js"

vi.mock("axios")

describe("release functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets releases", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        await new GetReleasesFunction().run(createMockContext(), "owner", "repo", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/releases", {
            params: { page: 2, per_page: 10 },
        })
    })

    it("gets a release", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { id: 7 } })

        await new GetReleaseFunction().run(createMockContext(), "owner", "repo", 7)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/releases/7")
    })

    it("updates a release", async () => {
        const data = { name: "Release" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 7 } })

        await new UpdateReleaseFunction().run(createMockContext(), "owner", "repo", 7, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/releases/7", data)
    })

    it("deletes a release", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new DeleteReleaseFunction().run(createMockContext(), "owner", "repo", 7)

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/releases/7")
    })

    it("rejects invalid release ids", async () => {
        await expect(new GetReleaseFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
