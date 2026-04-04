import baseConfig from "../../vitest.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(baseConfig, defineConfig({
    test: {
        include: ["**/*.{test,spec}.{ts,tsx}"]
    }
}));