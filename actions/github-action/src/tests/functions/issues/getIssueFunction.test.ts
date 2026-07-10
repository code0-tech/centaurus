import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { GetIssueFunction } from "../../../functions/issues/getIssueFunction.js"

vi.mock("axios")

describe("GetIssueFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("gets an issue by number", async () => {
        const issue = { id: 1, number: 123, title: "Bug" }
        mockGitHubClient.get.mockResolvedValueOnce({ data: issue })

        const result = await new GetIssueFunction().run(createMockContext(), "code0-tech", "centaurus", 123)

        expect(axios.create).toHaveBeenCalledWith({
            baseURL: "https://api.github.test",
            headers: {
                Authorization: "Bearer test-token",
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2026-03-10",
            },
        })
        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/code0-tech/centaurus/issues/123")
        expect(result).toEqual(issue)
    })

    it("encodes owner and repository", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { id: 1 } })

        await new GetIssueFunction().run(createMockContext(), "code0 tech", "repo/name", 1)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/code0%20tech/repo%2Fname/issues/1")
    })

    it("rejects invalid issue numbers", async () => {
        await expect(new GetIssueFunction().run(createMockContext(), "code0-tech", "centaurus", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(mockGitHubClient.get).not.toHaveBeenCalled()
    })
})
