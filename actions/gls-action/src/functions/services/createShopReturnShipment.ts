import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createShopReturnShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Creates a return shipment from a GLS Parcel Shop (customer drops off parcel at a shop)."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create shop return shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create shop return shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a return shipment from a GLS Parcel Shop (customer drops off parcel at a shop).",
                    }
                ],
                signature: `(numberOfLabels: number, ${DEFAULT_SIGNATURE_FOR_SERVICES}, returnQR: "PDF" | "PNG" | "ZPL"): GLS_CREATE_PARCELS_RESPONSE`,
                parameters: [
                    {
                        runtimeName: "numberOfLabels",
                        name: [
                            {
                                code: "en-US",
                                content: "The number of labels",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The number of labels to be created for the return shipment.",
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
