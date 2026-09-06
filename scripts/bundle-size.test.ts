import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { measureBundleDirectory } from "./bundle-size.mjs";

describe("measureBundleDirectory", () => {
  it("reports JavaScript and CSS assets with raw, gzip, and Brotli sizes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "typed-bundle-size-"));
    await writeFile(join(directory, "client.js"), "const count = 1;\n");
    await writeFile(join(directory, "client.css"), "body { color: red; }\n");
    await writeFile(join(directory, "client.js.map"), "not an asset");

    expect(await measureBundleDirectory(directory)).toEqual([
      { file: "client.css", raw: 21, gzip: 41, brotli: 25 },
      { file: "client.js", raw: 17, gzip: 37, brotli: 21 },
    ]);
  });
});
