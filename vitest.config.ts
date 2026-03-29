import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        include: ["actions/**/*.{test,spec}.{ts,tsx}"],
        environment: "node",
        exclude: ['**/dist/**'],
    },
});
