import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES, DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper,
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";
import { CreateParcelsResponse } from "../../types/glsCreateParcelsResponse";

export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitionsAndFunctionDefinitions(
        {
            definition: {
                runtimeName: "createShopDeliveryShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Delivers a parcel to a GLS Parcel Shop where the recipient can collect it."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create shop delivery shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create shop delivery shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Delivers a parcel to a GLS Parcel Shop where the recipient can collect it.",
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
