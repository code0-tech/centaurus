import {sdk} from "../../index";
import {
    DEFAULT_DATA_TYPES_FOR_SERVICES,
    DEFAULT_PARAMETERS_FOR_SERVICES,
    DEFAULT_SIGNATURE_FOR_SERVICES, postShipmentHelper
} from "../../helpers";
import {HerculesFunctionContext} from "@code0-tech/hercules";
import {
    CreateParcelsResponse,
    CustomContent,
    PrintingOptions,
    ReturnOptions,
    ShipmentWithoutServices
} from "../../types";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createAddresseeOnlyShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Create addressee only shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS addressee only shipment.",
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