#!/usr/bin/env node
/**
 * Runs an npm script in every action under actions/ that defines it.
 *
 * Usage: node scripts/for-each-action.mjs <script>
 *
 * Dependencies are installed automatically: with `npm ci` when running in CI,
 * otherwise with `npm install` and only if node_modules is missing.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptName = process.argv[2];
if (!scriptName) {
    console.error("Usage: node scripts/for-each-action.mjs <script>");
    process.exit(1);
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const actionsDir = join(rootDir, "actions");

const actions = readdirSync(actionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(actionsDir, entry.name))
    .filter((dir) => existsSync(join(dir, "package.json")));

if (actions.length === 0) {
    console.error(`No actions with a package.json found in ${actionsDir}`);
    process.exit(1);
}

const run = (command, args, cwd) => {
    console.log(`\n> ${command} ${args.join(" ")} (${cwd})`);
    const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    return result.status === 0;
};

const failed = [];
const skipped = [];

for (const actionDir of actions) {
    const pkg = JSON.parse(readFileSync(join(actionDir, "package.json"), "utf8"));

    if (!pkg.scripts?.[scriptName]) {
        skipped.push(pkg.name ?? actionDir);
        continue;
    }

    const installOk = process.env.CI
        ? run("npm", ["ci"], actionDir)
        : existsSync(join(actionDir, "node_modules")) || run("npm", ["install"], actionDir);

    if (!installOk || !run("npm", ["run", scriptName], actionDir)) {
        failed.push(pkg.name ?? actionDir);
    }
}

console.log(`\n--- ${scriptName} summary ---`);
console.log(`ran: ${actions.length - skipped.length}, skipped (no "${scriptName}" script): ${skipped.length}, failed: ${failed.length}`);
for (const name of skipped) console.log(`  skipped: ${name}`);
for (const name of failed) console.log(`  failed:  ${name}`);

if (failed.length > 0) process.exit(1);
if (actions.length === skipped.length) {
    console.error(`No action defines a "${scriptName}" script.`);
    process.exit(1);
}
