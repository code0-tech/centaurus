import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
    build: {
        target: "node22",
        ssr: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        rollupOptions: {
            external: (id) => ["@code0-tech/hercules", "@code0-tech/tucana/helpers", "@notionhq/client", "zod", "reflect-metadata"].includes(id) || id.startsWith("node:"),
        },
    },
});
