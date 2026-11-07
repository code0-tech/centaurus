import { Action, CodeZeroEvent } from "@code0-tech/hercules";

export function connectToAquila(action: Action): void {
    action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((error: Error) => {
        action.emit(CodeZeroEvent.error, error);
    });
}
