import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {AuthTokensConfigSchema} from "./config/authTokenConfig";
import {Model, MODEL_REGISTRY} from "./types/aiModel";

export function registerDefaultCommonAiModelFunction(sdk: ActionSdk, settingsTypeName: string, provider: Model["provider"], model: Model["model"]) {
    return sdk.registerFunctionDefinitions(
        {
            name: [
                {
                    code: "en-US",
                    content: `Create ${provider} - ${model}`
                }
            ],
            documentation: [
                {
                    code: "en-US",
                    content: "Auto generated wrapper function to create this model"
                }
            ],
            runtimeDefinitionName: "createModel",
            runtimeName: `${provider}/${model}`,
            signature: `(settings: ${settingsTypeName}, maxOutputTokens?: number, temperature?: number, maxRetries?: number, stopSequences?: string[], presencePenalty?: number, frequencyPenalty?: number, seed?: number): AI_MODEL`,
            parameters: [
                {
                    runtimeName: "provider",
                    defaultValue: provider,
                    hidden: true
                },
                {
                    runtimeName: "model",
                    defaultValue: model,
                    hidden: true,
                },
                {
                    runtimeName: "settings",
                    name: [
                        {
                            code: "en-US",
                            content: "Settings"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "The settings for this provider, for more information see the type"
                        }
                    ]
                },
                {
                    runtimeName: "maxOutputTokens",
                    name: [
                        {
                            code: "en-US",
                            content: "Max Output Tokens"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Maximum number of tokens to generate"
                        }
                    ]
                },
                {
                    description: [
                        {
                            code: "en-US",
                            content: "temperature is a parameter that controls the randomness of the model’s outputs during text generation. Normally between 0 and 1"
                        }
                    ],
                    name: [
                        {
                            code: "en-US",
                            content: "Temperature"
                        }
                    ],
                    runtimeName: "temperature"
                },
                {
                    runtimeName: "maxRetries",
                    name: [
                        {
                            code: "en-US",
                            content: "Maximum Retries"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Maximum number of retries. Set to 0 to disable retries. Default value is 2"
                        }
                    ],
                },
                {
                    runtimeName: "stopSequences",
                    name: [
                        {
                            code: "en-US",
                            content: "Stop sequences"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Stop sequences are specific strings (words, characters, or patterns) that tell an AI model when to stop generating text."
                        }
                    ]
                },
                {
                    runtimeName: "presencePenalty",
                    name: [
                        {
                            code: "en-US",
                            content: "Presence Penalty"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Presence penalty pushes the model to talk about new things instead of repeating existing ones. Typical range of 0-2"
                        }
                    ]
                },
                {
                    runtimeName: "frequencyPenalty",
                    name: [
                        {
                            code: "en-US",
                            content: "Frequency Penalty"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Frequency penalty is a parameter that reduces the likelihood of the model repeating the same words or phrases multiple times. Typical range of 0-2"
                        }
                    ]
                },
                {
                    runtimeName: "seed",
                    name: [
                        {
                            code: "en-US",
                            content: "Seed"
                        }
                    ],
                    description: [
                        {
                            code: "en-US",
                            content: "Seed is a parameter used to make AI model outputs reproducible."
                        }
                    ]
                }
            ],
        }
    );
}

export async function loadAllDefinitions(sdk: ActionSdk) {
    const modules = import.meta.glob([
        './{types,functions,config}/**/*.ts'
    ]);

    await loadAllDefinitionsByModules(sdk, modules)
}

export async function loadAllDefinitionsByModules(sdk: ActionSdk, modules: { [x: string]: () => any; }) {
    for (const path in modules) {
        const mod: any = await modules[path]();

        if (typeof mod.default !== 'function') continue

        if (mod.default.length === 1) {
            try {
                await mod.default(sdk);
            } catch (error) {
                console.log(`Error registering functions from ${path}:`, error);
            }
        } else if (mod.default.length === 3) {
            const parts = path.split("/")
            const provider = parts.at(-2) as Model["provider"]

            for (const model of MODEL_REGISTRY[provider]) {
                try {
                    await mod.default(sdk, provider, model);
                } catch (error) {
                    console.log(`Error registering functions from ${path}:`, error);
                }
            }
        }
    }
}

export function extractToken(context: HerculesFunctionContext, provider: Model["provider"], model: Model["model"]): string {
    const config = AuthTokensConfigSchema.safeParse(context.matchedConfig.findConfig("AUTH_TOKENS"));

    if (!config.success) {
        throw new RuntimeErrorException("Invalid Auth config")
    }

    const override = config.data[provider].overrides[model];
    if (override) {
        return override
    }

    return config.data[provider].defaultToken
}