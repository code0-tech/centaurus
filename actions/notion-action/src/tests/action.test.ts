import { describe, expect, it, vi } from "vitest";
import { action } from "../index.js";
import { supportingSchemaNames } from "../generated/notion-schema-order.js";

vi.mock("@code0-tech/hercules", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@code0-tech/hercules")>();
    return { ...actual, isExportMode: () => true };
});

describe("Hercules registration", () => {
    it("builds a module with all functions, data types and matching runtime events", () => {
        expect(action.runtimeFunctions.size).toBe(6);
        expect(action.dataTypes.size).toBe(9 + supportingSchemaNames.length);
        expect(action.events.size).toBe(3);
        expect(action.runtimeEvents.size).toBe(3);
        for (const event of action.events.values()) {
            const runtime = action.runtimeEvents.get(event.runtimeIdentifier!);
            expect(runtime?.signature).toBe(event.signature);
            expect(runtime?.settings).toEqual(event.settings);
            expect(event.signature).toContain("NOTION_PAGE");
        }
        const propertyEvent = action.events.get("NotionPagePropertyChanged");
        expect(propertyEvent?.settings?.map((setting) => setting.identifier).sort()).toEqual(["databaseId", "integrationToken", "pollIntervalSeconds", "propertyName"]);
        expect(() => action.buildModule()).not.toThrow();
    });

    it("takes the integration token per function and trigger instead of a module configuration", () => {
        expect(action.dataTypes.has("NOTION_INTEGRATION_TOKEN")).toBe(false);
        for (const fn of action.runtimeFunctions.values()) {
            expect(fn.signature).toMatch(/^\(integrationToken: string, /);
            // A closed parameter list followed by the return type.
            expect(fn.signature).toMatch(/^\(.*\): [A-Z_a-z]+$/);
            expect(fn.signature.split("(").length).toBe(fn.signature.split(")").length);
        }
        for (const event of action.events.values()) {
            expect(event.signature).toMatch(/^\(integrationToken: string, /);
            expect(event.settings?.find((setting) => setting.identifier === "pollIntervalSeconds")?.optional).toBe(true);
        }
        expect(action.buildModule().configurations ?? []).toHaveLength(0);
    });

    it("types response timestamps as DATE but keeps request timestamps as text", () => {
        const page = action.dataTypes.get("NOTION_PAGE")!.type;
        expect(page).toContain("created_time: DATE");
        expect(page).toContain("last_edited_time: DATE");
        expect(action.dataTypes.get("NOTION_PROPERTY_VALUE")!.type).toMatch(/expiry_time\??: string/);
    });
});
