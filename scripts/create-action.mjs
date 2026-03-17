#!/usr/bin/env node
// Creates a new package inside the packages/ workspace.
// Usage: npm run create-package -- <package-name>

import { mkdir, writeFile, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

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
await mkdir(join(packageDir, "src"), { recursive: true });

// package.json
const packageJson = {
  name: `@code0-tech/${actionName}`,
  version: "0.0.0",
  private: true,
  type: "module",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  scripts: {
    build: "tsc --build",
    lint: "eslint .",
  },
};

await writeFile(
  join(packageDir, "package.json"),
  JSON.stringify(packageJson, null, 2) + "\n"
);

// tsconfig.json
const tsconfig = {
  extends: "../../tsconfig.base.json",
  compilerOptions: {
    rootDir: "./src",
    outDir: "./dist",
    composite: true,
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

// Update root tsconfig.json references
const rootTsconfigPath = join(rootDir, "tsconfig.json");
const rootTsconfig = JSON.parse(await readFile(rootTsconfigPath, "utf-8"));

rootTsconfig.references = rootTsconfig.references ?? [];
rootTsconfig.references.push({ path: `actions/${actionName}` });

await writeFile(
  rootTsconfigPath,
  JSON.stringify(rootTsconfig, null, 2) + "\n"
);

console.log(`\n✅ Action "${actionName}" created successfully!`);
console.log(`   Location : actions/${actionName}`);
console.log(`   Run "npm install" to link the new workspace.`);
