import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreateIssueCommentFunction } from "../../../functions/issueComments/createIssueCommentFunction.js"
import { DeleteIssueCommentFunction } from "../../../functions/issueComments/deleteIssueCommentFunction.js"
import { GetIssueCommentsFunction } from "../../../functions/issueComments/getIssueCommentsFunction.js"
import { UpdateIssueCommentFunction } from "../../../functions/issueComments/updateIssueCommentFunction.js"

vi.mock("axios")

describe("issue comment functions", () => {
    beforeEach(resetGitHubClientMock)

    it("gets issue comments", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        const result = await new GetIssueCommentsFunction().run(createMockContext(), "owner", "repo", 3, 2, 25)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/issues/3/comments", {
            params: { page: 2, per_page: 25 },
        })
        expect(result).toEqual([{ id: 1 }])
    })

    it("creates an issue comment", async () => {
        const data = { body: "hello" }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1, ...data } })

        await new CreateIssueCommentFunction().run(createMockContext(), "owner", "repo", 3, data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/issues/3/comments", data)
    })

    it("updates an issue comment", async () => {
        const data = { body: "updated" }
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 9, ...data } })

        await new UpdateIssueCommentFunction().run(createMockContext(), "owner", "repo", 9, data)

        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/issues/comments/9", data)
    })

    it("deletes an issue comment", async () => {
        mockGitHubClient.delete.mockResolvedValueOnce({ data: {} })

        await new DeleteIssueCommentFunction().run(createMockContext(), "owner", "repo", 9)

        expect(mockGitHubClient.delete).toHaveBeenCalledWith("/repos/owner/repo/issues/comments/9")
    })

    it("rejects invalid comment ids", async () => {
        await expect(new DeleteIssueCommentFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
    })

    it("uses axios mock", () => {
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
