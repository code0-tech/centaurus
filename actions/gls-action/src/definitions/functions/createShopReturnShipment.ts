import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {
    CreateParcelsResponse,
    CustomContent,
    PrintingOptions,
    ReturnOptions,
    ShipmentWithoutServices
} from "../../types";
import {sdk} from "../../index";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createShopReturnShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create shop return shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS shop return shipment.",
                    }
                ],
                signature: `(numberOfLabels: number, ${DEFAULT_SIGNATURE_FOR_SERVICES}, returnQR: "PDF" | "PNG" | "ZPL"): GLS_CREATE_PARCELS_RESPONSE`,
                parameters: [
                    {
                        runtimeName: "parcelShopId",
                        name: [
                            {
                                code: "en-US",
                                content: "Parcel shop Id",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The ID of the parcel shop where the shipment should be delivered.",
                            }
                        ]
                    },
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                    {
                        runtimeName: "returnQR",
                        name: [
                            {
                                code: "en-US",
                                content: "Return QR",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The return QR of the shipment.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES
                ]
            },
            handler: async (context: HerculesFunctionContext, numberOfLabels: number, shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions, returnQR?: "PDF" | "PNG" | "ZPL"): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    ShopReturn: {
                        NumberOfLabels: numberOfLabels,
                        ReturnQR: returnQR
                    }
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}
