import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiMiddlewareHookSchema = z.enum(["before_model", "after_model"]);
export type AiMiddlewareHook = z.infer<typeof AiMiddlewareHookSchema>;

@Identifier("AI_MIDDLEWARE_HOOK")
@Name({ code: "en-US", content: "Middleware hook" })
@DisplayMessage({ code: "en-US", content: "Middleware hook" })
@Schema(AiMiddlewareHookSchema)
export class AiMiddlewareHookDataType {}
