import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_RETURN_OPTIONS",
            type: types.get("GLS_RETURN_OPTIONS")!,
            name: [
                {
                    code: "en-US",
                    content: "Return Options"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Return Options"
                }
            ]
        },
    )
}
