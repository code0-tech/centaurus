import {describe, it, expect, vi, beforeEach} from "vitest";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema
} from "../../src/types/glsReprintParcel";
import {withBaseFunctionMock} from "../helpers/withBaseFunction";
import {AuthenticationResponseData} from "../../src/types/auth";

const mockRequestData = {
    CreationDate: "2024-01-01T00:00:00Z",
    ParcelNumber: 0,
    PartnerParcelNumber: "",
    PrintingOptions: {
        ReturnLabels: {
            LabelFormat: "PDF",
            TemplateSet: "ZPL_300"
        }
    },
    ShipmentReference: "",
    ShipmentUnitReference: "",
    TrackID: "SOME_TRACK_ID"
};

const createContext = (): HerculesFunctionContext => ({
    matchedConfig: {
        projectId: 0,
        configValues: [],
        findConfig: (identifier) => {
            const map: Record<string, string> = {
                client_id: "SOME_ID",
                client_secret: "SOME_SECRET",
                auth_url: "AUTH_URL",
                ship_it_api_url: "API_URL"
            };
            return map[identifier];
        }
    },
    projectId: 0,
    executionId: "SOME_ID"
});

describe("reprintParcel.ts", () => {
    const postMock = vi.hoisted(() => vi.fn((url: string, data: any) => {
        if (url === "AUTH_URL") {
            const authResponse: AuthenticationResponseData = {
                access_token: "TOKEN",
                token_type: "Bearer",
                expires_in: 14000
            };
            return {data: authResponse};
        }

        expect(data).toEqual(mockRequestData);

        const result: ReprintParcelResponseData = {
            CreatedShipment: {
                GDPR: [],
                ParcelData: [],
                PrintData: [],
                CustomerID: "",
                PickupLocation: ""
            }
        };

        return {data: result};
    }));

    beforeEach(() => {
        vi.resetModules();

        vi.mock("axios", () => ({
            default: {
                post: postMock
            }
        }));
    });

    it("registers function definitions and calls API endpoints correctly", async () => {
        const {register} = await import("../../src/functions/reprintParcel");

        await withBaseFunctionMock(register, async (state) => {
            expect(state.registeredFunctionDefinitions).toHaveLength(1);

            const [reprintParcel] = state.registeredFunctionDefinitions;

            expect(reprintParcel.definition.runtimeName).toBe("reprintParcel");

            const result = await reprintParcel.handler(
                mockRequestData,
                createContext()
            );

            expect(ReprintParcelResponseDataSchema.safeParse(result).success).toBe(true);

            expect(postMock).toHaveBeenCalledTimes(2);

            expect(postMock.mock.calls[0]).toEqual(
                [
                    "AUTH_URL",
                    {
                        grant_type: 'client_credentials',
                        client_id: createContext().matchedConfig.findConfig("client_id"),
                        client_secret: createContext().matchedConfig.findConfig("client_secret"),
                    },
                    {
                        headers: {
                            'Content-Type': "application/x-www-form-urlencoded"
                        }
                    }
                ]
            );

            expect(postMock.mock.calls[1]).toEqual(
                [
                    "API_URL/rs/shipments/reprintparcel",
                    mockRequestData,
                    {
                        headers: {
                            Authorization: "Bearer TOKEN",
                            'Content-Type': "application/glsVersion1+json"
                        }
                    }
                ]
            );
        });
    });
});