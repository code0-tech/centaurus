import {RegistryState, runStandardActionDocs, StandardActionDocsConfig} from "../../../src/standardActionDocs"
import {loadAllDefinitions, loadAllDefinitionsByModules} from "../src/helpers";
import {ActionSdk} from "@code0-tech/hercules";

export function generateAIConfig(): StandardActionDocsConfig {
    return {
        actionName: "AI",
        typePrefix: "AI_",
        typesOutputPath: "../../docs/Actions/AI/types.mdx",
        functionsOutputPath: "../../docs/Actions/AI/functions.mdx",
        loadAllDefinitions: loadAllDefinitions,
        typeLinkOverrides: {},
        typesCopy: {
            title: "Datatypes",
            description: "All data types registered by the AI Action.",
            heading: "AI Action Types",
            intro: `The AI Action registers the following data types with the Hercules platform.`,
        },
        functionsCopy: {
            title: "Functions",
            description: "All functions registered by the AI Action.",
            intro: ""
        },
        functionGroups: [
            {
                heading: "OpenAI Models",
                loadFunctions: async (sdk) => await loadAllDefinitionsByModules(sdk, import.meta.glob("../src/functions/models/openai/common.ts")),
            },
            {
                heading: "Google Models",
                loadFunctions: async (sdk) => await loadAllDefinitionsByModules(sdk, import.meta.glob("../src/functions/models/google/common.ts")),
            },
            {
                heading: "Anthropic Models",
                loadFunctions: async (sdk) => await loadAllDefinitionsByModules(sdk, import.meta.glob("../src/functions/models/anthropic/common.ts")),
            },
            {
                heading: "Ollama",
                loadFunctions: async (sdk) => await loadAllDefinitionsByModules(sdk, import.meta.glob("../src/functions/models/ollama/common.ts")),
            },
        ],
    }
}

await runStandardActionDocs(generateAIConfig())
