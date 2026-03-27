import {sdk, types} from "../../index";

export function register() {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_UNIT_SERVICE",
            type: types.get("GLS_UNIT_SERVICE")!,
            name: [
                {
                    code: "en-US",
                    content: "Unit Service"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Unit Service"
                }
            ]
        },
    )
}
