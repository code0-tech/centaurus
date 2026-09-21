import { RuntimeError } from "@code0-tech/hercules"
import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockContext, mockGitHubClient, resetGitHubClientMock } from "../../testUtils.js"
import { CancelWorkflowRunFunction } from "../../../functions/ciAutomation/cancelWorkflowRunFunction.js"
import { CreateCheckRunFunction } from "../../../functions/ciAutomation/createCheckRunFunction.js"
import { CreateCommitStatusFunction } from "../../../functions/ciAutomation/createCommitStatusFunction.js"
import { GetCommitStatusesFunction } from "../../../functions/ciAutomation/getCommitStatusesFunction.js"
import { GetWorkflowRunsFunction } from "../../../functions/ciAutomation/getWorkflowRunsFunction.js"
import { GetWorkflowsFunction } from "../../../functions/ciAutomation/getWorkflowsFunction.js"
import { RerunWorkflowRunFunction } from "../../../functions/ciAutomation/rerunWorkflowRunFunction.js"
import { UpdateCheckRunFunction } from "../../../functions/ciAutomation/updateCheckRunFunction.js"

vi.mock("axios")

describe("CI automation functions", () => {
    beforeEach(resetGitHubClientMock)

    it("creates a commit status", async () => {
        const data = { state: "success" as const }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })

        await new CreateCommitStatusFunction().run(createMockContext(), "owner", "repo", "abc", data)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/statuses/abc", data)
    })

    it("gets commit statuses", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] })

        await new GetCommitStatusesFunction().run(createMockContext(), "owner", "repo", "main")

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/commits/main/statuses")
    })

    it("creates and updates check runs", async () => {
        const createData = { name: "ci", head_sha: "abc" }
        const updateData = { status: "completed" as const }
        mockGitHubClient.post.mockResolvedValueOnce({ data: { id: 1 } })
        mockGitHubClient.patch.mockResolvedValueOnce({ data: { id: 1 } })

        await new CreateCheckRunFunction().run(createMockContext(), "owner", "repo", createData)
        await new UpdateCheckRunFunction().run(createMockContext(), "owner", "repo", 1, updateData)

        expect(mockGitHubClient.post).toHaveBeenCalledWith("/repos/owner/repo/check-runs", createData)
        expect(mockGitHubClient.patch).toHaveBeenCalledWith("/repos/owner/repo/check-runs/1", updateData)
    })

    it("gets workflows", async () => {
        mockGitHubClient.get.mockResolvedValueOnce({ data: { workflows: [{ id: 1 }] } })

        await new GetWorkflowsFunction().run(createMockContext(), "owner", "repo", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenCalledWith("/repos/owner/repo/actions/workflows", {
            params: { page: 2, per_page: 10 },
        })
    })

    it("gets workflow runs for repository and workflow", async () => {
        mockGitHubClient.get.mockResolvedValue({ data: { workflow_runs: [{ id: 1 }] } })

        await new GetWorkflowRunsFunction().run(createMockContext(), "owner", "repo")
        await new GetWorkflowRunsFunction().run(createMockContext(), "owner", "repo", "deploy.yml", 2, 10)

        expect(mockGitHubClient.get).toHaveBeenNthCalledWith(1, "/repos/owner/repo/actions/runs", {
            params: { page: 1, per_page: 30 },
        })
        expect(mockGitHubClient.get).toHaveBeenNthCalledWith(2, "/repos/owner/repo/actions/workflows/deploy.yml/runs", {
            params: { page: 2, per_page: 10 },
        })
    })

    it("reruns and cancels workflow runs", async () => {
        mockGitHubClient.post.mockResolvedValue({ data: {} })

        await new RerunWorkflowRunFunction().run(createMockContext(), "owner", "repo", 1)
        await new CancelWorkflowRunFunction().run(createMockContext(), "owner", "repo", 1)

        expect(mockGitHubClient.post).toHaveBeenNthCalledWith(1, "/repos/owner/repo/actions/runs/1/rerun")
        expect(mockGitHubClient.post).toHaveBeenNthCalledWith(2, "/repos/owner/repo/actions/runs/1/cancel")
    })

    it("rejects invalid workflow run ids", async () => {
        await expect(new RerunWorkflowRunFunction().run(createMockContext(), "owner", "repo", 0)).rejects.toBeInstanceOf(RuntimeError)
        expect(vi.mocked(axios.create)).toBeDefined()
    })
})
