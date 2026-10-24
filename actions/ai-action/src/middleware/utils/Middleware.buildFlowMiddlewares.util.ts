import type { SubFlow } from "@code0-tech/hercules";
import { createMiddleware, type AnyAgentMiddleware } from "langchain";
import { createHookHandler } from "./Middleware.createHookHandler.util.js";

const JUMP_TARGETS = ["model", "tools", "end"] as const;

export function buildFlowMiddlewares(runs: SubFlow[], agentName: string): AnyAgentMiddleware[] {
    return runs.map(
        (run, index) =>
            createMiddleware({
                name: `flow_middleware_${index + 1}`,
                beforeModel: { hook: createHookHandler(run, agentName, "before_model"), canJumpTo: [...JUMP_TARGETS] },
                afterModel: { hook: createHookHandler(run, agentName, "after_model"), canJumpTo: [...JUMP_TARGETS] },
            } as never) as AnyAgentMiddleware,
    );
}
