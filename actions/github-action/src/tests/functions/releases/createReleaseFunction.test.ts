import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CreateReleaseFunction } from "../../../functions/releases/createReleaseFunction.js"

vi.mock("axios")

describe("CreateReleaseFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("creates a release", async () => {
        const data = { tag_name: "v1.0.0", name: "v1.0.0" }
        const release = { id: 1, ...data }
        mockGitHubClient.post.mockResolvedValueOnce({ data: release })

        const result = await new CreateReleaseFunction().run(createMockContext(), "code0-tech", "centaurus", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/code0-tech/centaurus/releases", data)
        expect(result).toEqual(release)
    })
})
