import {z} from "zod";
import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers";

export const MODEL_REGISTRY = {
    openai: ['gpt-5.1'],
    google: ['gemini-2.5-flash'],
    anthropic: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-6'],
    ollama: ['selfhosted']
} as const


type Provider = keyof typeof MODEL_REGISTRY
export const ProviderEnum = z.enum(Object.keys(MODEL_REGISTRY) as [Provider, ...Provider[]])

export const ModelSchema = z.object({
    provider: ProviderEnum.describe(`
    @description The provider, either pass in the raw provider you want to use, or use the appropriate functions to create this object
        `),
    model: z.string().describe(`
    @description The model of the provider, either pass in the raw model you want to use, or use the appropriate functions to create this object
    `),
    settings: z.looseObject({}).optional(),
    seed: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxRetries: z.number().optional(),
    stopSequences: z.array(z.string()).optional(),
    presencePenalty: z.number().min(-1).max(1).optional(),
    frequencyPenalty: z.number().min(-1).max(1).optional()
})


export type Model = z.infer<typeof ModelSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_MODEL", ModelSchema),
        identifier: "AI_MODEL"
    })
}