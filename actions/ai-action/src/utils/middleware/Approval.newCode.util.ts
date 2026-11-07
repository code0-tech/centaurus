import { randomBytes } from "node:crypto";

/** A fresh code for one question, which is what makes an approval single-use. */
export const newCode = (): string => randomBytes(3).toString("hex");
