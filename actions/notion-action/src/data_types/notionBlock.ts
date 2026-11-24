import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/notion-schemas.js";

/** The full Notion block request shape, used to validate blocks at runtime. */
export const NotionBlockRequestSchema = schemas.NotionBlock;

/**
 * The NOTION_BLOCK data type is deliberately compact: the generated
 * BlockObjectRequest union (~14k characters of nested block types) makes the
 * flow editor's type checker hang while computing parameter suggestions, so no
 * previous node could be selected for a block parameter. Notion itself still
 * validates block-specific shapes.
 */
export const NotionBlockSchema = z.looseObject({ type: z.string(), object: z.literal("block").optional() });
export type NotionBlock = z.infer<typeof NotionBlockSchema>;

@Identifier("NOTION_BLOCK")
@Name({ code: "en-US", content: "Notion block" })
@DisplayMessage({ code: "en-US", content: "Notion block" })
@Schema(NotionBlockSchema)
export class NotionBlockDataType {}
