import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreateIssueFunction } from "../../../functions/issues/createIssueFunction.js"

vi.mock("axios")

describe("CreateIssueFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("creates an issue with request data", async () => {
        const data = { title: "New issue", body: "Details" }
        const issue = { id: 1, ...data }
        mockGitHubClient.post.mockResolvedValueOnce({ data: issue })

        const result = await new CreateIssueFunction().run(createMockContext(), "code0-tech", "centaurus", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/code0-tech/centaurus/issues", data)
        expect(result).toEqual(issue)
    })
})
