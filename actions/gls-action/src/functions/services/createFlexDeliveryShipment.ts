import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";
import {ReturnOptions} from "../../types/glsReturnOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {PrintingOptions} from "../../types/glsPrintingOptions";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createFlexDeliveryShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create flex delivery shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS flex delivery shipment.",
                    }
                ],
                signature: `(${DEFAULT_SIGNATURE_FOR_SERVICES}): GLS_CREATE_PARCELS_RESPONSE`,
                parameters: [
                    ...DEFAULT_PARAMETERS_FOR_SERVICES,
                ],
                linkedDataTypes: [
                    ...DEFAULT_DATA_TYPES_FOR_SERVICES,
                ]
            },
            handler: async (context: HerculesFunctionContext,
                            shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions,
            ): Promise<CreateParcelsResponse> => {
                return postShipmentHelper(context, [{
                    FlexDeliveryService: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}