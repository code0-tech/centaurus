import {sdk} from "../../../index";
import {CustomContent} from "../../../types";

function register() {
    sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createCustomContent",
                signature: "(barcodeContentType: \"TRACK_ID\"|\"GLS_SHIPMENT_REFERENCE\", customerLogo: string, hideShipperAddress?: boolean, barcodeType?: \"EAN_128\"|\"CODE_39\", barcode?: string): GLS_CUSTOM_CONTENT",
                name: [
                    {
                        code: "en-US",
                        content: "Create custom content",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS custom content object for shipment labels.",
                    }
                ],
                parameters: [
                    {
                        runtimeName: "barcodeContentType",
                        name: [
                            {code: "en-US", content: "Barcode content type"}
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "Type of content encoded in the barcode (TRACK_ID or GLS_SHIPMENT_REFERENCE)."
                            }
                        ]
                    },
                    {
                        runtimeName: "customerLogo",
                        name: [
                            {code: "en-US", content: "Customer logo"}
                        ],
                        description: [
                            {code: "en-US", content: "Base64-encoded customer logo to print on the label."}
                        ]
                    },
                    {
                        runtimeName: "hideShipperAddress",
                        name: [
                            {code: "en-US", content: "Hide shipper address"}
                        ],
                        description: [
                            {code: "en-US", content: "Whether to hide the shipper address on the label."}
                        ]
                    },
                    {
                        runtimeName: "barcodeType",
                        name: [
                            {code: "en-US", content: "Barcode type"}
                        ],
                        description: [
                            {code: "en-US", content: "Type of barcode to use (EAN_128 or CODE_39)."}
                        ]
                    },
                    {
                        runtimeName: "barcode",
                        name: [
                            {code: "en-US", content: "Barcode"}
                        ],
                        description: [
                            {code: "en-US", content: "Barcode value to print on the label."}
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_CUSTOM_CONTENT",
                ]
            },
            handler: (barcodeContentType: CustomContent["BarcodeContentType"], customerLogo: string, hideShipperAddress?: boolean, barcodeType?: CustomContent["BarcodeType"], barcode?: string): CustomContent => {
                return {
                    Barcode: barcode,
                    BarcodeContentType: barcodeContentType,
                    BarcodeType: barcodeType,
                    CustomerLogo: customerLogo,
                    HideShipperAddress: hideShipperAddress,
                }
            }
        },
    )
}