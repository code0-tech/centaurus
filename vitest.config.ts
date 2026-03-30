import { defineConfig } from "vitest/config";
import {resolve} from "path";

export default defineConfig({
    test: {
        include: [resolve(__dirname, "actions/**/*.{test,spec}.{ts,tsx}")],
        environment: "node",
        exclude: ["**/dist/**"],
        setupFiles: [resolve(__dirname, "vitest.setup.ts")],
    },
});