import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { DispatchWorkflowFunction } from "../../../functions/ciAutomation/dispatchWorkflowFunction.js"

vi.mock("axios")

describe("DispatchWorkflowFunction", () => {
    beforeEach(resetGitHubClientMock)

    it("dispatches a workflow", async () => {
        const data = { ref: "main", inputs: { environment: "prod" } }
        mockGitHubClient.post.mockResolvedValueOnce({ data: {} })

        await new DispatchWorkflowFunction().run(createMockContext(), "code0-tech", "centaurus", "deploy.yml", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/code0-tech/centaurus/actions/workflows/deploy.yml/dispatches", data)
    })
})
