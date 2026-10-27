import axios, { AxiosError } from "axios"
import { z } from "zod"
import { FunctionContext, RuntimeError } from "@code0-tech/hercules"
import {
    GitHubLabelReference,
    GitHubMilestoneReference,
    GitHubUserReference,
} from "./data_types/references/githubReferences.js"

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
    // Errors we raised ourselves already carry the right code (an invalid
    // assignee, label or milestone) - keep it instead of relabelling them.
    if (error instanceof RuntimeError) {
        throw error
    }

    // A failed response parse is a schema problem on our side, not an API
    // failure - report it as such instead of hiding it behind GITHUB_API_ERROR.
    if (error instanceof z.ZodError) {
        throw new RuntimeError(
            "GITHUB_UNEXPECTED_RESPONSE",
            `The GitHub API returned a response that does not match the expected shape: ${error.message}`
        )
    }

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

/** Drops the fields the caller left empty so optional parameters are not sent as nulls. */
export function requestBody(fields: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null))
}

/** Resolves a label reference to the label name GitHub expects in request bodies. */
export function labelName(label: GitHubLabelReference): string {
    const name = typeof label === "string" ? label : label.name
    if (!name) throw new RuntimeError("GITHUB_INVALID_LABEL", "A label needs a name.")
    return name
}

/** Resolves a user reference to the login GitHub expects in request bodies. */
export function userLogin(user: GitHubUserReference): string {
    const login = typeof user === "string" ? user : user?.login
    if (!login) throw new RuntimeError("GITHUB_INVALID_ASSIGNEE", "An assignee needs a username.")
    return login
}

/** Resolves a milestone reference to the milestone number GitHub expects in request bodies. */
export function milestoneNumber(milestone: GitHubMilestoneReference | undefined): number | undefined {
    if (milestone === undefined || milestone === null) return undefined
    const number = typeof milestone === "number" ? milestone : milestone.number
    if (number === undefined) throw new RuntimeError("GITHUB_INVALID_MILESTONE", "A milestone needs a number.")
    return number
}
