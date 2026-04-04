import {beforeEach, vi} from "vitest";
import {
    ActionSdk,
    HerculesActionConfigurationDefinition,
    HerculesDataType,
    HerculesFlowType, HerculesRegisterFunctionDefinition,
    HerculesRegisterRuntimeFunctionParameter
} from "@code0-tech/hercules";
import {SdkMockState} from "../index.test";

export const withSdkMock = async (tests: (state: SdkMockState) => void) => {
    const state = vi.hoisted(() => {
        const state: SdkMockState = {
            registeredFunctionDefinitions: [] as HerculesRegisterFunctionDefinition[],
            registeredRuntimeFunctionDefinitions: [] as HerculesRegisterRuntimeFunctionParameter[],
            dataTypes: [] as HerculesDataType[],
            flowTypes: [] as HerculesFlowType[],
            configDefinitions: [] as HerculesActionConfigurationDefinition[],
        };
        return state
    })


    vi.mock("@code0-tech/hercules", async (importOriginal) => {
        const actual = await importOriginal() as any
        return {
            ...actual,
            createSdk: (config, configDefinitions) => {
                state.configDefinitions = configDefinitions || null

                const mockedActionSdk: ActionSdk = {
                    registerFunctionDefinitions(...functionDefinitions: HerculesRegisterFunctionDefinition[]): Promise<void> {
                        functionDefinitions.forEach(value => {
                            state.registeredFunctionDefinitions.push(value)
                        })
                        return Promise.resolve(undefined);
                    },
                    registerRuntimeFunctionDefinitionsAndFunctionDefinitions(...runtimeFunctionDefinitions: HerculesRegisterRuntimeFunctionParameter[]): Promise<void> {
                        runtimeFunctionDefinitions.forEach(value => {
                            state.registeredRuntimeFunctionDefinitions.push(value)
                        })

                        runtimeFunctionDefinitions.forEach(value => {
                            state.registeredFunctionDefinitions.push({
                                ...value.definition,
                                runtimeDefinitionName: value.definition.runtimeName,
                                parameters: value.definition.parameters.map(param =>{
                                    return {
                                        ...param,
                                        runtimeDefinitionName: param.runtimeName
                                    }
                                })
                            })
                        })
                        return Promise.resolve(undefined);
                    },
                    config: config,
                    registerRuntimeFunctionDefinitions: (...defs: HerculesRegisterRuntimeFunctionParameter[]) => {
                        defs.forEach(value => {
                            state.registeredRuntimeFunctionDefinitions.push(value)
                        })
                        return Promise.resolve();
                    },

                    registerConfigDefinitions: (...defs: HerculesActionConfigurationDefinition[]) => {
                        state.configDefinitions = defs;
                        return Promise.resolve();
                    },

                    registerDataTypes: (...types: HerculesDataType[]) => {
                        state.dataTypes = types;
                        return Promise.resolve();
                    },

                    registerFlowTypes: (...types: HerculesFlowType[]) => {
                        state.flowTypes = types;
                        return Promise.resolve();
                    },
                    fullyConnected: () => {
                        return true
                    },
                    connect: vi.fn(() => {
                        return Promise.resolve([]);
                    }),
                    onError: vi.fn(),
                    dispatchEvent: vi.fn(),
                    getProjectActionConfigurations: vi.fn()
                }
                return mockedActionSdk

            }
        }

    })


    beforeEach(() => {
        state.registeredFunctionDefinitions = null;
        state.dataTypes = null;
        state.flowTypes = null;
        state.configDefinitions = null;
    });

    tests(state);
}