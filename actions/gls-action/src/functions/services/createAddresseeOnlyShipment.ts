import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {ShipmentWithoutServices} from "../../types/glsShipment";
import {CreateParcelsResponse} from "../../types/glsCreateParcelsResponse";
import {PrintingOptions} from "../../types/glsPrintingOptions";
import {CustomContent} from "../../types/glsCustomContent";
import {ReturnOptions} from "../../types/glsReturnOptions";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createAddresseeOnlyShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Creates a shipment that can only be delivered to the named addressee (no neighbor delivery)."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create addressee only shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create addressee only shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a shipment that can only be delivered to the named addressee (no neighbor delivery).",
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
                    AddresseeOnlyService: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}

