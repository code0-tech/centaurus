import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_ADDRESS",
            type: types.get("GLS_ADDRESS")!,
            name: [
                {
                    code: "en-US",
                    content: "Address"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Address"
                }
            ]
        },
    )
}