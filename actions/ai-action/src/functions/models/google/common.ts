import {ActionSdk} from "@code0-tech/hercules";
import {Model} from "../../../types/aiModel";
import {registerDefaultCommonAiModelFunction} from "../../../helpers";

export default (sdk: ActionSdk, provider: Model["provider"], model: Model["model"]) => {
    if (!provider || !model) return Promise.resolve()
    return registerDefaultCommonAiModelFunction(sdk, "AI_GOOGLE_SETTINGS", provider, model)
}