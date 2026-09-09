import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreateMilestoneFunction } from "../../../functions/milestones/createMilestoneFunction.js"
import { DeleteMilestoneFunction } from "../../../functions/milestones/deleteMilestoneFunction.js"
import { GetMilestoneFunction } from "../../../functions/milestones/getMilestoneFunction.js"
import { GetMilestonesFunction } from "../../../functions/milestones/getMilestonesFunction.js"
import { UpdateMilestoneFunction } from "../../../functions/milestones/updateMilestoneFunction.js"

vi.mock("axios")

describe("milestone functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets milestones", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ number: 1 }] })

        await new GetMilestonesFunction().run(createMockContext(), "owner", "repo", "all", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/milestones", {
            params: { state: "all", page: 2, per_page: 10 },
        })
    })

    it("gets one milestone", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { number: 1 } })

        await new GetMilestoneFunction().run(createMockContext(), "owner", "repo", 1)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/milestones/1")
    })

    it("creates a milestone", async () => {
        const data = { title: "v1" }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { number: 1 } })

        await new CreateMilestoneFunction().run(createMockContext(), "owner", "repo", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/milestones", data)
    })

    it("updates a milestone", async () => {
        const data = { title: "v2" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { number: 1 } })

        await new UpdateMilestoneFunction().run(createMockContext(), "owner", "repo", 1, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/milestones/1", data)
    })

    it("deletes a milestone", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new DeleteMilestoneFunction().run(createMockContext(), "owner", "repo", 1)

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/milestones/1")
    })

    it("rejects invalid milestone numbers", async () => {
        await expect(new GetMilestoneFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
