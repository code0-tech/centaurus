import {ActionSdk} from "@code0-tech/hercules";

export function register(sdk: ActionSdk) {
    return sdk.registerConfigDefinitions(
        {
            identifier: "client_secret",
            type: "TEXT",
            name: [
                {
                    code: "en-US",
                    content: "Client secret"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The client secret to authenticate with the GLS API"
                }
            ],
            linkedDataTypes: ["TEXT"],
        },
    )
}