import {beforeEach, vi} from "vitest";
import {
    ActionSdk,
    HerculesActionConfigurationDefinition,
    HerculesDataType,
    HerculesFlowType,
    HerculesRegisterFunctionParameter
} from "@code0-tech/hercules";
import {SdkMockState} from "../index.test";

export const withSdkMock = async (tests: (state: SdkMockState) => void) => {
    const state = vi.hoisted(() => {
        const state: SdkMockState = {
            registeredFunctionDefinitions: [] as HerculesRegisterFunctionParameter[],
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
                    config: config,
                    registerFunctionDefinitions: (...defs: HerculesRegisterFunctionParameter[]) => {
                        state.registeredFunctionDefinitions = defs;
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
                    connect: vi.fn((options) => {
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