import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { AddLabelsToIssueFunction } from "../../../functions/labels/addLabelsToIssueFunction.js"
import { GetIssueLabelsFunction } from "../../../functions/labels/getIssueLabelsFunction.js"
import { GetLabelsFunction } from "../../../functions/labels/getLabelsFunction.js"
import { RemoveAllLabelsFromIssueFunction } from "../../../functions/labels/removeAllLabelsFromIssueFunction.js"
import { RemoveLabelFromIssueFunction } from "../../../functions/labels/removeLabelFromIssueFunction.js"
import { SetLabelsForIssueFunction } from "../../../functions/labels/setLabelsForIssueFunction.js"

vi.mock("axios")

describe("label functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets repository labels", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ name: "bug" }] })

        await new GetLabelsFunction().run(createMockContext(), "owner", "repo", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/labels", {
            params: { page: 2, per_page: 10 },
        })
    })

    it("gets issue labels", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ name: "bug" }] })

        await new GetIssueLabelsFunction().run(createMockContext(), "owner", "repo", 3)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/issues/3/labels")
    })

    it("adds labels to an issue", async () => {
        const data = { labels: ["bug"] }
        mockGitHubClient.post.mockResolvedValueOnce({ data: [{ name: "bug" }] })

        await new AddLabelsToIssueFunction().run(createMockContext(), "owner", "repo", 3, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/issues/3/labels", data)
    })

    it("sets labels for an issue", async () => {
        const data = { labels: ["bug"] }
        mockGitHubClient.put.mockResolvedValueOnce({ data: [{ name: "bug" }] })

        await new SetLabelsForIssueFunction().run(createMockContext(), "owner", "repo", 3, data)

        expect(mockGitHubClient.put).toHaveBeenCalledWith("/repos/owner/repo/issues/3/labels", data)
    })

    it("removes one label from an issue", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: [] })

        await new RemoveLabelFromIssueFunction().run(createMockContext(), "owner", "repo", 3, "needs review")

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/issues/3/labels/needs%20review")
    })

    it("removes all labels from an issue", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new RemoveAllLabelsFromIssueFunction().run(createMockContext(), "owner", "repo", 3)

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/issues/3/labels")
    })

    it("rejects invalid issue numbers", async () => {
        await expect(new GetIssueLabelsFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
