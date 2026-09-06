import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import server from "@typed/astro/server";
import { Window } from "happy-dom";
import ts from "typescript-compiler";
import { createServer } from "vite";
import { describe, expect, it } from "vitest";
import { expandCurriculumSources } from "../../tutorial/Files.js";
import Demo from "../../site/components/CurriculumDemo.js";

const exampleRoot = fileURLToPath(new URL("../../tutorial/examples/", import.meta.url));

describe("Quick Start examples", () => {
  it.each(["counter-reactive", "counter-component", "counter-hydrated"])(
    "embeds %s under the page landmark and heading",
    async (id) => {
      const { html } = await server.renderToStaticMarkup(Demo, { id });
      const document = new Window().document;
      document.body.innerHTML = `<main><h1>Guide</h1>${html}</main>`;
      expect(document.querySelectorAll("main")).toHaveLength(1);
      expect(document.querySelectorAll("h1")).toHaveLength(1);
      expect(document.querySelector('section[aria-label="Counter"]')).not.toBeNull();
      expect(document.querySelector("#counter-title")).toBeNull();
    },
  );

  it("keeps every authored source excerpt attached to its intended code", () => {
    const directory = new URL("../../../content/learn/", import.meta.url);
    for (const file of fs.readdirSync(directory)) {
      if (!file.endsWith(".md")) continue;
      const expanded = expandCurriculumSources(fs.readFileSync(new URL(file, directory), "utf8"));
      expect(expanded, file).not.toContain("// @source");
      expect(expanded, file).not.toContain("// @expect");
    }
  });

  it("keeps every copyable browser and server module free of unused imports", () => {
    const files: Array<string> = [
      fileURLToPath(new URL("../../../../../examples/counter/src/main.ts", import.meta.url)),
    ];
    for (let stage = 2; stage <= 6; stage++) {
      const root = path.join(exampleRoot, `learn-${stage}`);
      for (const entry of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".ts")) {
          files.push(path.join(entry.parentPath, entry.name));
        }
      }
    }
    const program = ts.createProgram(files, {
      esModuleInterop: true,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      noUnusedLocals: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    });
    expect(
      ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => exampleRoot,
        getNewLine: () => "\n",
      }),
    ).toBe("");
  });

  it.each([
    { stage: 5, initial: "0", restoresState: false },
    { stage: 6, initial: "7", restoresState: true },
  ])(
    "runs the stage $stage server and transforms its browser entry through Vite",
    async ({ stage, initial, restoresState }) => {
      const vite = await createServer({
        root: path.join(exampleRoot, `learn-${stage}`),
        configFile: false,
        appType: "custom",
        server: { middlewareMode: true, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
      });
      try {
        const { markup } = await vite.ssrLoadModule("/src/server.ts");
        const document = new Window().document;
        document.documentElement.innerHTML = markup;
        expect(markup).toMatch(/^<!doctype html>/u);
        expect(document.querySelector("#app output")?.textContent).toBe(initial);
        expect(document.querySelectorAll("main")).toHaveLength(1);
        expect(document.querySelector("main")?.id).toBe("app");
        expect(document.querySelector('script[type="module"]')?.getAttribute("src")).toBe(
          "/src/client.ts",
        );
        expect(markup.includes("data-typed-refsubject")).toBe(restoresState);
        expect(await vite.transformIndexHtml("/", markup)).toContain("/@vite/client");
        expect((await vite.transformRequest("/src/client.ts"))?.code).toContain(
          "DomRenderTemplate.using(document)",
        );
      } finally {
        await vite.close();
      }
    },
    15_000,
  );
});
