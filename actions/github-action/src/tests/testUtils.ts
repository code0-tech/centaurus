import axios from "axios"
import { vi } from "vitest"
import type { FunctionContext } from "@code0-tech/hercules"

export const mockGitHubClient = {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
}

export function createMockContext(): FunctionContext {
    return {
        matchedConfig: {
            findConfig: (key: string) => {
                if (key === "github_token") return "test-token"
                if (key === "github_api_url") return "https://api.github.test"
                return undefined
            },
        },
    } as unknown as FunctionContext
}

export function resetGitHubClientMock() {
    vi.clearAllMocks()
    vi.mocked(axios.create).mockReturnValue(mockGitHubClient as never)
}
