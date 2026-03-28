import {sdk} from "../../index";

export function register() {
    return sdk.registerConfigDefinitions(
        {
            identifier: "auth_url",
            type: "TEXT",
            defaultValue: "https://api.gls-group.net/oauth2/v2/token",
            name: [
                {
                    code: "en-US",
                    content: "The Auth API url"
                }
            ],
            description: [
                {
                    code: "en-US",
                    content: "The url of the Auth api ending in /token."
                }
            ],
            linkedDataTypes: ["STRING"],
        },
    )
}
