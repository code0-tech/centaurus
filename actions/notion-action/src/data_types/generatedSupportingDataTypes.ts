import { Action, Identifier, Name, Schema } from "@code0-tech/hercules";
import { createHash } from "node:crypto";
import { schemas } from "../generated/notion-schemas.js";
import { supportingSchemaNames } from "../generated/notion-schema-order.js";

// Like Stripe's generated support types: name shared schema components so the
// Hercules type export retains references instead of expanding every block,
// rich-text and emoji union at each occurrence in a page/query response.
export function registerNotionSupportingDataTypes(action: Action) {
    for (const name of supportingSchemaNames) {
        const full = `NOTION_SCHEMA_${name.toUpperCase()}`;
        const identifier = full.length <= 50 ? full : `${full.slice(0, 37)}_${createHash("sha256").update(name).digest("hex").slice(0, 12).toUpperCase()}`;
        class SupportingDataType {}
        Identifier(identifier)(SupportingDataType);
        Name({ code: "en-US", content: `Notion ${name}` })(SupportingDataType);
        Schema(schemas[name])(SupportingDataType);
        action.registerDataTypeClass(SupportingDataType);
    }
}
