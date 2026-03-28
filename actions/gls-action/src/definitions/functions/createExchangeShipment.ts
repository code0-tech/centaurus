import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import { PrintingOptions } from "../datatypes/glsPrintingOptions";
import {AddressSchema} from "../datatypes/glsAddress";
import {ShipmentWithoutServices} from "../datatypes/glsShipment";
import {CustomContent} from "../datatypes/glsCustomContent";
import {ReturnOptions} from "../datatypes/glsReturnOptions";
import {CreateParcelsResponse} from "../datatypes/glsCreateParcelsResponse";

export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createExchangeShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create exchange shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS exchange shipment.",
                    }
                ],
                signature: `(address: GLS_ADDRESS, ${DEFAULT_SIGNATURE_FOR_SERVICES}, expectedWeight?: number): GLS_CREATE_PARCELS_RESPONSE`,
                parameters: [
                    {
                        runtimeName: "address",
                        name: [
                            {
                                code: "en-US",
                                content: "Address",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The address of the exchange shipment.",
                            }
                        ]
                    },
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                    {
                        runtimeName: "expectedWeight",
                        name: [
                            {
                                code: "en-US",
                                content: "Expected weight",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The expected weight for the exchange shipment.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
                    "GLS_ADDRESS"
                ]
            },
            handler: async (context: HerculesFunctionContext,
                            address: AddressSchema,
                            shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
                            expectedWeight?: number): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    Exchange: {
                        Address: address,
                        ExpectedWeight: expectedWeight
                    }
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}