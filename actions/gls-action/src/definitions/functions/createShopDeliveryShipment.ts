import {sdk} from "../../index";
import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES, DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper,
} from "../../helpers";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {
    CreateParcelsResponse, CustomContent, PrintingOptions,
    ReturnOptions, ShipmentWithoutServices
} from "../../types";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createShopDeliveryShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create shop delivery shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS shop delivery shipment.",
                    }
                ],
                signature: `(parcelShopId: string, ${DEFAULT_SIGNATURE_FOR_SERVICES}): GLS_CREATE_PARCELS_RESPONSE`,
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
                    ...DEFAULT_PARAMETERS_FOR_SERVICES
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES
                ]
            },
            handler: async (context: HerculesFunctionContext, parcelShopId: string, shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    ShopDelivery: {
                        ParcelShopID: parcelShopId
                    }
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}




