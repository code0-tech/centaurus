import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPPER",
            type: types.get("GLS_SHIPPER")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipper"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipper"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS"
            ]
        }
    )
}
