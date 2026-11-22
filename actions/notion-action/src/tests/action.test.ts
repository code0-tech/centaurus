import { describe, expect, it, vi } from "vitest";
import { action } from "../index.js";
import { supportingSchemaNames } from "../generated/notion-schema-order.js";

vi.mock("@code0-tech/hercules", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@code0-tech/hercules")>();
    return { ...actual, isExportMode: () => true };
});

describe("Hercules registration", () => {
    it("builds a module with all functions, data types and matching runtime events", () => {
        expect(action.runtimeFunctions.size).toBe(9);
        expect(action.dataTypes.size).toBe(13 + supportingSchemaNames.length);
        expect(action.events.size).toBe(3);
        expect(action.runtimeEvents.size).toBe(3);
        for (const event of action.events.values()) {
            const runtime = action.runtimeEvents.get(event.runtimeIdentifier!);
            expect(runtime?.signature).toBe(event.signature);
            expect(runtime?.settings).toEqual(event.settings);
            expect(event.signature).toContain("NOTION_PAGE");
        }
        const propertyEvent = action.events.get("NotionPagePropertyChanged");
        expect(propertyEvent?.settings?.map((setting) => setting.identifier).sort()).toEqual(["databaseId", "propertyName"]);
        expect(() => action.buildModule()).not.toThrow();
    });

    it("types response timestamps as DATE but keeps request timestamps as text", () => {
        const page = action.dataTypes.get("NOTION_PAGE")!.type;
        expect(page).toContain("created_time: DATE");
        expect(page).toContain("last_edited_time: DATE");
        expect(action.dataTypes.get("NOTION_PROPERTY_VALUE")!.type).toMatch(/expiry_time\??: string/);
    });
});
