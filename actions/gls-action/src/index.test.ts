import {describe, it, expect, vi, beforeEach, test} from "vitest";
import {GrpcOptions} from "@protobuf-ts/grpc-transport";

const state = vi.hoisted(() => {
    const state = {
        registeredFunctionDefinitions: [] as HerculesRegisterFunctionParameter[],
        dataTypes: [] as HerculesDataType[],
        flowTypes: [] as HerculesFlowType[],
        configDefinitions: [] as HerculesActionConfigurationDefinition[],

        createSdkMock: (config: any, configDefinition?: any) => {
            state.configDefinitions = configDefinition ?? null;

            return {
                config,

                registerFunctionDefinitions: (...defs: HerculesRegisterFunctionParameter[]) => {
                    state.registeredFunctionDefinitions = defs;
                    return Promise.resolve();
                },

                registerConfigDefinitions: (...defs: any[]) => {
                    state.configDefinitions = defs;
                    return Promise.resolve();
                },

                registerDataTypes: (...types: any[]) => {
                    state.dataTypes = types;
                    return Promise.resolve();
                },

                registerFlowTypes: (...types: any[]) => {
                    state.flowTypes = types;
                    return Promise.resolve();
                },

                fullyConnected: () => false,
                connect: () => Promise.resolve([]),
                onError: () => {
                },
                getProjectActionConfigurations: () => [],
                dispatchEvent: () => Promise.resolve(),
            };
        },
    };

    return state;
});
vi.mock("@code0-tech/hercules", () => ({
    createSdk: state.createSdkMock,
}));

import {
    createSdk,
    HerculesActionConfigurationDefinition, HerculesDataType, HerculesFlowType, HerculesRegisterFunctionParameter
} from "@code0-tech/hercules";

beforeEach(() => {
    state.registeredFunctionDefinitions = null;
    state.dataTypes = null;
    state.flowTypes = null;
    state.configDefinitions = null;
});

describe("Hercules SDK mock", () => {
    it("registers config definitions", async () => {
        const sdk = createSdk({
            authToken: "testToken",
            aquilaUrl: "http://localhost:50051",
            actionId: "testAction",
            version: "1.0.0",
        });

        await sdk.registerConfigDefinitions({
            identifier: "config_test",
            type: "STRING",
        });

        expect(state.configDefinitions).toEqual([
            {identifier: "config_test", type: "STRING"},
        ]);
    });

    it("registers data and flow types", async () => {
        const sdk = createSdk({
            authToken: "testToken",
            aquilaUrl: "http://localhost:50051",
            actionId: "testAction",
            version: "1.0.0",
        });

        await sdk.registerDataTypes({
            identifier: "Data1",
            type: "string",
        });

        await sdk.registerFlowTypes({
            identifier: "Flow1",
            editable: false,
        });

        expect(state.dataTypes).toEqual([
            {identifier: "Data1", type: "string"},
        ]);

        expect(state.flowTypes).toEqual([
            {identifier: "Flow1", editable: false},
        ]);
    });
});


describe("executes index.ts", async () => {
    it('should be valid', async () => {
        vi.resetModules();     // clear module cache
        await import("./index");  // now it runs

        state.dataTypes?.forEach((dataType: HerculesDataType) => {
            expect(dataType.identifier.startsWith("GLS_"), `${dataType.identifier}: Identifier should start with GLS_`).toBeTruthy()
            expect(dataType.name || [], `${dataType.identifier}: Name should be set`).not.toHaveLength(0)
            expect(dataType.displayMessage || [], `${dataType.identifier}: Display message should be set`).not.toHaveLength(0)
        })

        state.configDefinitions?.forEach(value => {
            expect(value.name || [], `${value.identifier}: Name should be set`).not.toHaveLength(0)
            expect(value.description || [], `${value.identifier}: Description should be set`).not.toHaveLength(0)
            expect(value.linkedDataTypes || [], `${value.identifier}: Linked data types should be set`).not.toHaveLength(0)
        })

        state.flowTypes?.forEach(value => {
            expect(value.identifier.startsWith("GLS_"), `${value.identifier}: Identifier should start with GLS_`).toBeTruthy()
            expect(value.name || [], `${value.identifier}: Name should be set`).not.toHaveLength(0)
            expect(value.description || [], `${value.identifier}: Description should be set`).not.toHaveLength(0)
            expect(value.displayMessage || [], `${value.identifier}: Display message should be set`).not.toHaveLength(0)
            expect(value.documentation || [], `${value.identifier}: Documentation should be set`).not.toHaveLength(0)
        })

        state.registeredFunctionDefinitions?.forEach(value => {
            expect(value.definition.name || [], `${value.definition.runtimeName}: Name should be set`).not.toHaveLength(0)
            expect(value.definition.description || [], `${value.definition.runtimeName}: Description should be set`).not.toHaveLength(0)
            value.definition.parameters.forEach(param => {
                expect(param.name || [], `${value.definition.runtimeName} parameter ${param.runtimeName}: Name should be set`).not.toHaveLength(0)
                expect(param.description || [], `${value.definition.runtimeName} parameter ${param.runtimeName}: Description should be set`).not.toHaveLength(0)
            })
        })
    });
});