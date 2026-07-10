import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { AddAssigneesToIssueFunction } from "../../../functions/issues/addAssigneesToIssueFunction.js"
import { AddAssigneeToIssueFunction } from "../../../functions/issues/addAssigneeToIssueFunction.js"
import { CloseIssueFunction } from "../../../functions/issues/closeIssueFunction.js"
import { GetIssuesFunction } from "../../../functions/issues/getIssuesFunction.js"
import { RemoveAssigneesFromIssueFunction } from "../../../functions/issues/removeAssigneesFromIssueFunction.js"
import { RemoveAssigneeFromIssueFunction } from "../../../functions/issues/removeAssigneeFromIssueFunction.js"
import { ReopenIssueFunction } from "../../../functions/issues/reopenIssueFunction.js"
import { UpdateIssueFunction } from "../../../functions/issues/updateIssueFunction.js"

vi.mock("axios")

describe("issue functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets issues and filters pull requests out", async () => {
        const issue = { id: 1, number: 1 }
        mockGitHubClient.get.mockResolvedValueOnce({ data: [issue, { id: 2, pull_request: {} }] })

        const result = await new GetIssuesFunction().run(createMockContext(), "owner", "repo", "all", 2, 50)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/issues", {
            params: { state: "all", page: 2, per_page: 50 },
        })
        expect(result).toEqual([issue])
    })

    it("rejects invalid issues pagination", async () => {
        await expect(new GetIssuesFunction().run(createMockContext(), "owner", "repo", "open", 0)).rejects.toBeInstanceOf(RuntimeError)
    })

    it("updates an issue", async () => {
        const data = { title: "Updated" }
        const issue = { id: 1, title: "Updated" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: issue })

        const result = await new UpdateIssueFunction().run(createMockContext(), "owner", "repo", 7, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/issues/7", data)
        expect(result).toEqual(issue)
    })

    it("closes and reopens an issue", async () => {
        mockGitHubClient.patch.mockResolvedValue({ data: { id: 1 } })

        await new CloseIssueFunction().run(createMockContext(), "owner", "repo", 7)
        await new ReopenIssueFunction().run(createMockContext(), "owner", "repo", 7)

        expect(mockGitHubClient.patch).toHaveBeenNthCalledWith(1, "/repos/owner/repo/issues/7", { state: "closed" })
        expect(mockGitHubClient.patch).toHaveBeenNthCalledWith(2, "/repos/owner/repo/issues/7", { state: "open" })
    })

    it("adds one assignee to an issue", async () => {
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new AddAssigneeToIssueFunction().run(createMockContext(), "owner", "repo", 7, "marius")

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/issues/7/assignees", { assignees: ["marius"] })
    })

    it("adds and removes multiple assignees", async () => {
        const data = { assignees: ["a", "b"] }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })
        mockGitHubClient.delete.mockResolvedValueOnce({ data: { id: 1 } })

        await new AddAssigneesToIssueFunction().run(createMockContext(), "owner", "repo", 7, data)
        await new RemoveAssigneesFromIssueFunction().run(createMockContext(), "owner", "repo", 7, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/issues/7/assignees", data)
        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/issues/7/assignees", { data })
    })

    it("removes one assignee from an issue", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: { id: 1 } })

        await new RemoveAssigneeFromIssueFunction().run(createMockContext(), "owner", "repo", 7, "marius")

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/issues/7/assignees", { data: { assignees: ["marius"] } })
    })

    it("creates the configured axios GitHub client", async () => {
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 1 } })

        await new CloseIssueFunction().run(createMockContext(), "owner", "repo", 1)

        expect(axios.create).toHaveBeenCalled()
    })
})
