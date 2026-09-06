import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/** Compile source fixtures normally while published-entry tests use emitted JS. */
export function bridgeSource(): Plugin {
  return {
    name: "typed-svelte-test-bridge",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        importer?.replaceAll("\\", "/").includes("/packages/svelte/src/") &&
        /^\.\/Bridge\.(client|server)\.js$/.test(source)
      ) {
        return fileURLToPath(new URL("./src/internal/Bridge.svelte", import.meta.url));
      }
    },
  };
}
