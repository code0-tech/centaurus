import {ActionSdk} from "@code0-tech/hercules";

export default (sdk: ActionSdk) => {
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