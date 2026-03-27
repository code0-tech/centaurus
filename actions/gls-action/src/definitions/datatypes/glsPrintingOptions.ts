import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_PRINTING_OPTIONS",
            type: types.get("GLS_PRINTING_OPTIONS")!,
            name: [
                {
                    code: "en-US",
                    content: "Printing Options"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Printing Options"
                }
            ]
        },
    )
}