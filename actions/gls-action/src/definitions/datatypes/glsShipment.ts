import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT",
            type: types.get("GLS_SHIPMENT")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment"
                }
            ],
            linkedDataTypes: [
                "GLS_SHIPMENT_SERVICE",
                "GLS_ADDRESS",
                "GLS_SHIPMENT_UNIT",
                "GLS_CONSIGNEE",
                "GLS_SHIPPER"
            ]
        },
        {
            identifier: "GLS_SHIPMENT_WITHOUT_SERVICES",
            type: types.get("GLS_SHIPMENT_WITHOUT_SERVICES")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment without services"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment without services"
                }
            ],
            linkedDataTypes: [
                "GLS_SHIPMENT",
                "GLS_PRINTING_OPTIONS",
                "GLS_RETURN_OPTIONS",
                "GLS_CUSTOM_CONTENT"
            ]
        },
    )
}