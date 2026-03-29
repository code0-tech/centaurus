import {ActionSdk} from "@code0-tech/hercules";

export default (sdk: ActionSdk) => {
    return sdk.registerConfigDefinitions(
        {
            identifier: "client_id",
            type: "TEXT",
            name: [
                {
                    code: "en-US",
                    content: "Client ID"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The client id to authenticate with the GLS API"
                }
            ],
            linkedDataTypes: ["TEXT"],
        },
    )
}
