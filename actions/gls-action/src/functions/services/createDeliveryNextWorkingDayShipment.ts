import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";

export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitionsAndFunctionDefinitions(
        {
            definition: {
                runtimeName: "createDeliveryNextWorkingDayShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Creates an EXPRESS shipment for delivery on the next working day (EOB service)."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create delivery next working day shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create delivery next working day shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates an EXPRESS shipment for delivery on the next working day (EOB service).",
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
                    throw new RuntimeErrorException("INVALID_PRODUCT", "The product for Delivery Next Working Day service must be EXPRESS.")
                }
                return postShipmentHelper(context, [{
                    EOB: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}