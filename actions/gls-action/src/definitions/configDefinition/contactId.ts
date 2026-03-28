import {sdk} from "../../index";

export function register() {
    return sdk.registerConfigDefinitions(
        {
            identifier: "contact_id",
            type: "TEXT",
            name: [
                {
                    code: "en-US",
                    content: "Contact ID"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The contact id identifying the GLS account to use for the API requests. This contact must be linked to a GLS contract with API access."
                }
            ],
            defaultValue: "",
            linkedDataTypes: ["TEXT"],
        },
    )
}