import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { MergePullRequestFunction } from "../../../functions/pullRequests/mergePullRequestFunction.js"

vi.mock("axios")

describe("MergePullRequestFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("merges a pull request", async () => {
        const data = { merge_method: "squash" as const }
        const mergeResult = { merged: true, message: "Merged" }
        mockGitHubClient.put.mockResolvedValueOnce({ data: mergeResult })

        const result = await new MergePullRequestFunction().run(createMockContext(), "code0-tech", "centaurus", 42, data)

        expect(mockGitHubClient.put).toHaveBeenCalledWith("/repos/code0-tech/centaurus/pulls/42/merge", data)
        expect(result).toEqual(mergeResult)
    })

    it("rejects invalid pull request numbers", async () => {
        await expect(new MergePullRequestFunction().run(createMockContext(), "code0-tech", "centaurus", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(mockGitHubClient.put).not.toHaveBeenCalled()
    })
})
