import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT_UNIT",
            type: types.get("GLS_SHIPMENT_UNIT")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment Unit"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment Unit"
                }
            ],
            linkedDataTypes: [
                "GLS_UNIT_SERVICE",
            ]
        },
    )
}
