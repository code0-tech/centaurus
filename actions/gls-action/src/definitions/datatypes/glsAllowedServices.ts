import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_ALLOWED_SERVICES_REQUEST_DATA",
            type: types.get("GLS_ALLOWED_SERVICES_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Allowed services request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Allowed services request data"
                }
            ]
        },
        {
            identifier: "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
            type: types.get("GLS_ALLOWED_SERVICES_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Allowed services response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Allowed services response data"
                }
            ]
        },

    )
}
