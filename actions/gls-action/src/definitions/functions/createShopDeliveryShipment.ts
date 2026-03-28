import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES, DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper,
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../datatypes/glsShipment";
import {PrintingOptions} from "../datatypes/glsPrintingOptions";
import {CustomContent} from "../datatypes/glsCustomContent";
import {ReturnOptions} from "../datatypes/glsReturnOptions";
import { CreateParcelsResponse } from "../datatypes/glsCreateParcelsResponse";

export function register(sdk: ActionSdk) {
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




