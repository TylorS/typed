import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));

const authoredMarkdown = ["guides", "recipes"].flatMap((directory) => {
  const root = path.join(websiteRoot, "content", directory);
  return fs
    .readdirSync(root)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      fileName: `${directory}/${fileName}`,
      source: fs.readFileSync(path.join(root, fileName), "utf8"),
    }));
});

describe("authored error examples", () => {
  it("uses Effect tagged error constructors instead of hand-written _tag records", () => {
    const handWrittenError =
      /(?:type|interface)\s+[A-Za-z][A-Za-z0-9]*Error\b[\s\S]{0,200}?readonly\s+_tag\s*:|_tag\s*:\s*["'][^"']*Error["']|class\s+[A-Za-z][A-Za-z0-9]*Error\s+extends\s+Error\b/u;
    const offenders = authoredMarkdown
      .filter(({ source }) => handWrittenError.test(source))
      .map(({ fileName }) => fileName);

    expect(offenders).toEqual([]);
  });
});
