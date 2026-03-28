import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        include: ["actions/**/src/**/*.{test,spec}.{ts,tsx}"],
        environment: "node",
        exclude: ['**/dist/**'],
    },
});
