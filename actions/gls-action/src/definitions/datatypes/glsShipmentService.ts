import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT_SERVICE",
            type: types.get("GLS_SHIPMENT_SERVICE")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment Service"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment Service"
                }
            ]
        },
    )
}
