#!/usr/bin/env node
// Creates a new package inside the packages/ workspace.
// Usage: npm run create-package -- <package-name>

import {mkdir, writeFile} from "fs/promises";
import {join, dirname} from "path";
import {fileURLToPath} from "url";
import {existsSync} from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const actionName = process.argv[2];

if (!actionName) {
    console.error("Usage: npm run create-package -- <package-name>");
    process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(actionName)) {
    console.error(
        "Action name must start with a lowercase letter and contain only lowercase letters, digits, and hyphens."
    );
    process.exit(1);
}

const packageDir = join(rootDir, "actions", actionName);

if (existsSync(packageDir)) {
    console.error(
        `Action "${actionName}" already exists at actions/${actionName}`
    );
    process.exit(1);
}

console.log(`Creating action "${actionName}"...`);

// Create directory structure
await mkdir(join(packageDir, "src"), {recursive: true});

// package.json
const packageJson = {
    name: `@code0-tech/${actionName}`,
    version: "0.0.0",
    private: true,
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    scripts: {
        build: "vite build",
        lint: "eslint .",
        test: "vitest run",
        start: "node dist/main.js",
        "generate:docs": "npm run build && node dist/generateDocs.js"
    },
};

await writeFile(
    join(packageDir, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n"
);

await writeFile(join(packageDir, "vite.config.ts"), `
import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
    build: {
        target: 'node18',
        ssr: true,
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.ts'),
                generateDocs: resolve(__dirname, 'scripts/generateDocs.ts')
            },
            external: [
                'fs',
                'path',
                'os',
                'crypto',
                'stream',
                'util',
                'events',
                'buffer',
                'url',
                'zlib',
                'node:fs',
                'node:path'
            ]
        }
    }
});
`);

await writeFile(join(packageDir, "vitetest.config.ts"), `
import baseConfig from "../../vitest.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(baseConfig, defineConfig({
    test: {
        include: ["**/*.{test,spec}.{ts,tsx}"]
    }
}));
`);


// tsconfig.json
const tsconfig = {
    extends: "../../tsconfig.base.json",
    compilerOptions: {
        outDir: "dist",
    },
    include: ["src"],
    exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
};

await writeFile(
    join(packageDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n"
);

// src/index.ts
await writeFile(join(packageDir, "src", "index.ts"), `// ${actionName}\n`);

console.log(`\n✅ Action "${actionName}" created successfully!`);
console.log(`   Location : actions/${actionName}`);
console.log(`   Run "npm install" to link the new workspace.`);
