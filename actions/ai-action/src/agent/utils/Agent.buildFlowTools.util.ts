import type { SubFlow } from "@code0-tech/hercules";
import type { ClientTool } from "@langchain/core/tools";
import { tool } from "langchain";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";
import { emptyJsonSchema } from "../../shared/utils/Shared.emptyJsonSchema.util.js";

export function buildFlowTools(runs: SubFlow[]): ClientTool[] {
    return runs.map((run, index) => {
        const schema = run.inputSchema as Record<string, unknown> | undefined;

        return tool(
            (args: unknown) =>
                Promise.resolve(run(args as never)).then(
                    (result) => (typeof result === "string" ? result : JSON.stringify(result ?? null)),
                    (error: unknown) => `The tool failed: ${describeError(error)}`,
                ),
            {
                name: `tool_${index + 1}`,
                description: typeof schema?.description === "string" ? schema.description : "",
                schema: (schema ?? emptyJsonSchema()) as never,
            },
        ) as unknown as ClientTool;
    });
}
