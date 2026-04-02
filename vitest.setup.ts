import { beforeEach, vi } from "vitest";

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation((...args) => {
        throw new Error(args.join(" "));
    });
});

process.on("unhandledRejection", (err) => {
    throw err;
});

process.on("uncaughtException", (err) => {
    throw err;
});