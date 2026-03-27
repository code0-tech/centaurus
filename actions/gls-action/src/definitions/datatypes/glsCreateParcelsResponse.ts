import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CREATE_PARCELS_RESPONSE",
            type: types.get("GLS_CREATE_PARCELS_RESPONSE")!,
            name: [
                {
                    code: "en-US",
                    content: "Create parcels response"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Create parcels response"
                }
            ]
        },
    )
}
