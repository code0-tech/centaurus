import { z } from "zod";

export const AiToolChoiceSchema = z.string();
export type AiToolChoice = z.infer<typeof AiToolChoiceSchema>;
