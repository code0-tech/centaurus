import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {Model} from "../../types/aiModel";


export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitions({
        definition: {
            runtimeName: "createModel",
            signature: "(settings: object, maxOutputTokens?: number, temperature?: number, maxRetries?: number, stopSequences?: string[], presencePenalty?: number, frequencyPenalty?: number, seed?: number) => AI_MODEL",
            parameters: [
                {
                    runtimeName: "provider",
                },
                {
                    runtimeName: "model",
                },
                {
                    runtimeName: "settings",
                },
                {
                    runtimeName: "maxOutputTokens"
                },
                {
                    runtimeName: "temperature"
                },
                {
                    runtimeName: "maxRetries"
                },
                {
                    runtimeName: "stopSequences"
                },
                {
                    runtimeName: "presencePenalty"
                },
                {
                    runtimeName: "frequencyPenalty"
                },
                {
                    runtimeName: "seed"
                }
            ],
        },
        handler: (provider: Model["provider"],
                  model: Model["model"],
                  maxOutputTokens?: Model["maxOutputTokens"],
                  temperature?: Model["temperature"],
                  maxRetries?: Model["maxRetries"],
                  stopSequences?: Model["stopSequences"],
                  presencePenalty?: Model["presencePenalty"],
                  frequencyPenalty?: Model["frequencyPenalty"],
                  seed?: Model["seed"]
        ): Model => {
            return {
                provider: provider,
                model: model,
                maxOutputTokens: maxOutputTokens,
                frequencyPenalty: frequencyPenalty,
                presencePenalty: presencePenalty,
                stopSequences: stopSequences,
                temperature: temperature,
                maxRetries: maxRetries,
                seed: seed
            }
        }
    })
}