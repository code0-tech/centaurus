import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CUSTOM_CONTENT",
            type: types.get("GLS_CUSTOM_CONTENT")!,
            name: [
                {
                    code: "en-US",
                    content: "Custom content"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Custom content"
                }
            ]
        },
    )
}
