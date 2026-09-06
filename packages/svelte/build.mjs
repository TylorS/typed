import { readFile, writeFile, mkdir } from "node:fs/promises";
import { compile } from "svelte/compiler";
import config from "./svelte.config.js";

// Publish regular JavaScript for each rendering environment so consumers of
// view do not need a .svelte loader. Compile the inverse component's
// native async SSR here so consuming Svelte apps need no compiler opt-in.
await mkdir(new URL("dist/internal/", import.meta.url), { recursive: true });
const source = await readFile(new URL("src/internal/Bridge.svelte", import.meta.url), "utf8");
for (const generate of ["client", "server"]) {
  const output = compile(source, {
    ...config.compilerOptions,
    filename: "Bridge.svelte",
    generate,
    dev: false,
  });
  await writeFile(new URL(`dist/internal/Bridge.${generate}.js`, import.meta.url), output.js.code);
}
const inverse = await readFile(new URL("src/Typed.svelte", import.meta.url), "utf8");
for (const generate of ["client", "server"]) {
  const source = inverse.replace(
    "./internal/RenderSnapshot.js",
    `./internal/RenderSnapshot.${generate}.js`,
  );
  const output = compile(source, {
    ...config.compilerOptions,
    filename: "Typed.svelte",
    generate,
    dev: false,
  });
  await writeFile(new URL(`dist/Typed.${generate}.js`, import.meta.url), output.js.code);
}
