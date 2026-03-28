import {ActionSdk} from "@code0-tech/hercules";
import {PrintingOptions, ReturnLabels} from "../../datatypes/glsPrintingOptions";

function register(sdk: ActionSdk) {
    sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createPrintingOptions",
                signature: "(returnLabels: RETURN_LABELS): GLS_PRINTING_OPTIONS",
                name: [
                    {
                        code: "en-US",
                        content: "Create printing options",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS printing options object which can be used when creating shipments.",
                    }
                ],
                parameters: [
                    {
                        runtimeName: "returnLabels",
                        name: [
                            {
                                code: "en-US",
                                content: "Return labels",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The return labels to be included in the shipment.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_PRINTING_OPTIONS",
                    "RETURN_LABELS"
                ]
            },
            handler: (returnLabels: ReturnLabels): PrintingOptions => {
                return {
                    ReturnLabels: returnLabels
                }
            }
        },
    )
}
