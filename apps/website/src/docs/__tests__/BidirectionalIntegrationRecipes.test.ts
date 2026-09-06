import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const require = createRequire(import.meta.url);
const loadSvelte2Tsx = () => {
  const Module = require("node:module") as { _load: (...args: Array<any>) => unknown };
  const load = Module._load;
  Module._load = (request, parent, ...args) =>
    request === "typescript" && parent?.filename?.includes("svelte2tsx")
      ? require("typescript-compiler")
      : load(request, parent, ...args);
  try {
    return require("svelte2tsx").svelte2tsx as (
      source: string,
      options: { readonly filename: string; readonly mode: "ts" },
    ) => { readonly code: string };
  } finally {
    Module._load = load;
  }
};
const svelte2tsx = loadSvelte2Tsx();
const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const slugs = ["react", "vue", "svelte", "web-component"] as const;
const documents = slugs.map((slug) => ({
  slug,
  body: readFileSync(path.join(websiteRoot, "content/recipes", `${slug}.md`), "utf8"),
}));
const svelteFences = (markdown: string) =>
  Array.from(markdown.matchAll(/^```svelte\s*\r?\n([\s\S]*?)^```\s*$/gmu), ([, source], index) => ({
    source: source!,
    filename:
      source!.match(/^<!--\s*([A-Za-z][A-Za-z0-9_-]*\.svelte)\s*-->/u)?.[1] ??
      `Example${index}.svelte`,
  }));

describe("bidirectional integration recipes", () => {
  it("covers both rendering directions and scoped ownership", () => {
    for (const document of documents) {
      expect(document.body, document.slug).toContain("output inside Typed");
      expect(document.body, document.slug).toContain("## Typed output inside");
      expect(document.body, document.slug).toContain("Scope");
    }
  });

  it("type-checks all TypeScript and Svelte scripts against public packages", () => {
    const staging = mkdtempSync(path.join(websiteRoot, ".recipe-test-"));
    try {
      const files = [
        require.resolve("svelte2tsx/svelte-shims-v4.d.ts"),
        require.resolve("svelte2tsx/svelte-jsx-v4.d.ts"),
      ];
      const vueFiles: Array<string> = [];
      for (const document of documents) {
        const directory = path.join(staging, document.slug);
        mkdirSync(directory, { recursive: true });
        for (const [index, fence] of extractTypeScriptFenceDocuments(document.body).entries()) {
          const file = path.join(
            directory,
            fence.fileName ?? `example-${index}.${fence.extension}`,
          );
          mkdirSync(path.dirname(file), { recursive: true });
          writeFileSync(file, fence.code);
          (document.slug === "vue" ? vueFiles : files).push(file);
        }
        for (const { source, filename } of svelteFences(document.body)) {
          // TypeScript resolves ./Component.svelte to Component.svelte.ts. The generated
          // module retains Svelte's real inferred props and public component contract.
          const file = path.join(directory, `${filename}.ts`);
          writeFileSync(file, svelte2tsx(source, { filename, mode: "ts" }).code);
          files.push(file);
        }
      }
      // Each JSX runtime needs its own compilation and type namespace.
      for (const [examples, jsxImportSource] of [
        [files, "react"],
        [vueFiles, "vue"],
      ] as const) {
        const program = ts.createProgram(examples, {
          allowJs: false,
          esModuleInterop: true,
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          noEmit: true,
          jsx: jsxImportSource === "vue" ? ts.JsxEmit.Preserve : ts.JsxEmit.ReactJSX,
          jsxImportSource,
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ES2022,
        });
        const diagnostics = ts.getPreEmitDiagnostics(program);
        expect(
          ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => websiteRoot,
            getNewLine: () => "\n",
          }),
        ).toBe("");
      }
    } finally {
      rmSync(staging, { force: true, recursive: true });
    }
  }, 60_000);

  it.each(["client", "server"] as const)(
    "compiles all Svelte examples for %s output",
    (generate) => {
      const fences = documents.flatMap(({ body }) => svelteFences(body));
      expect(fences.length).toBeGreaterThan(0);
      for (const { source, filename } of fences) {
        expect(() => compile(source, { filename, generate })).not.toThrow();
      }
    },
  );
});
