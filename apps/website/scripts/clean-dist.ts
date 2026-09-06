import * as fs from "node:fs/promises";
import * as path from "node:path";

const websiteRoot = path.resolve(import.meta.dirname, "..");

await fs.rm(path.join(websiteRoot, "dist"), {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 100,
});
