import type { OpenAiErrorBody } from "../../types/openai/OpenAiServer.types.js";

/** An error as an OpenAI client reads it, which is the only shape it understands. */
export const errorBody = (message: string, type: string, code?: string): OpenAiErrorBody => ({
    error: { message, type, ...(code ? { code } : {}) },
});
