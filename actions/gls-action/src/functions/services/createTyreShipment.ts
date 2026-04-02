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
                runtimeName: "createTyreShipment",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create tyre shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create tyre shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS tyre shipment.",
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
                    TyreService: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}