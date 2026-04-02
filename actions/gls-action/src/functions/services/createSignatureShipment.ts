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
    sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createSignatureShipment",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create signature shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Create signature shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS signature shipment.",
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
                    SignatureService: {}
                }], shipment, printingOptions, customContent, returnOptions)
            }
        },
    )
}