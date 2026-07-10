import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreateBranchFunction } from "../../../functions/repositories/createBranchFunction.js"

vi.mock("axios")

describe("CreateBranchFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("creates a branch ref from a SHA", async () => {
        mockGitHubClient.post.mockResolvedValueOnce({ data: {} })

        await new CreateBranchFunction().run(createMockContext(), "code0-tech", "centaurus", {
            branch: "feature/test",
            sha: "abc123",
        })

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/code0-tech/centaurus/git/refs", {
            ref: "refs/heads/feature/test",
            sha: "abc123",
        })
    })
})
