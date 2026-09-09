import axios, { AxiosError } from "axios"
import { FunctionContext, RuntimeError } from "@code0-tech/hercules"

export function createGitHubClient(context: FunctionContext) {
    const token = context.matchedConfig.findConfig("github_token") as string
    const baseURL = context.matchedConfig.findConfig("github_api_url") as string

    return axios.create({
        baseURL,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10",
        },
    })
}

export function handleGitHubError(error: unknown): never {
    if (error instanceof AxiosError) {
        const message =
            typeof error.response?.data === "object" && error.response?.data !== null && "message" in error.response.data
                ? String(error.response.data.message)
                : error.message

        switch (error.response?.status) {
            case 401:
                throw new RuntimeError("GITHUB_AUTHENTICATION_FAILED", message)
            case 403:
                throw new RuntimeError("GITHUB_ACCESS_DENIED", message)
            case 404:
                throw new RuntimeError("GITHUB_REPOSITORY_NOT_FOUND", message)
            case 422:
                throw new RuntimeError("GITHUB_INVALID_REQUEST", message)
        }

        throw new RuntimeError("GITHUB_API_ERROR", message)
    }

    throw new RuntimeError("GITHUB_API_ERROR", String(error))
}
