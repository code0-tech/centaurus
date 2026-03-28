import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ShipmentWithoutServices} from "../datatypes/glsShipment";
import {PrintingOptions} from "../datatypes/glsPrintingOptions";
import {CustomContent} from "../datatypes/glsCustomContent";
import {ReturnOptions} from "../datatypes/glsReturnOptions";
import {CreateParcelsResponse} from "../datatypes/glsCreateParcelsResponse";


export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createDeliverySaturdayShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create delivery Saturday shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS delivery Saturday shipment.",
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
                if (shipment.Product != "EXPRESS") {
                    throw new RuntimeErrorException("INVALID_PRODUCT", "The product for Delivery Friday service must be EXPRESS.")
                }
                return postShipmentHelper(context, [{
                    SaturdayService: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}