import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(import.meta.dirname, "../..");

const sourceFiles = (directory: string): ReadonlyArray<string> =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return entry === "__tests__" || entry === "generated" ? [] : sourceFiles(path);
    }

    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });

describe("Typed template attributes", () => {
  it("uses direct or sparse attribute parts instead of nested template strings", () => {
    const offenders = sourceFiles(sourceRoot).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return source.includes("=${`") ? [relative(sourceRoot, path)] : [];
    });

    expect(offenders).toEqual([]);
  });
});
