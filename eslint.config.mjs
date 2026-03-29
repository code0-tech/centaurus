import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    globalIgnores(["**/dist/**", "**/node_modules/**"]),

    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },

    {
        files: ["scripts/**/*.mjs"],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        "rules": {
            "@typescript-eslint/no-unused-vars": [
                "error"
            ]
        }
    }
]);
