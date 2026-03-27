import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CONSIGNEE",
            type: types.get("GLS_CONSIGNEE")!,
            name: [
                {
                    code: "en-US",
                    content: "Consignee"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Consignee"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS"
            ]
        },
    )
}
