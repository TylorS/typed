import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFenceDocuments, extractTypeScriptFences } from "../RecipeValidation.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const routingFiles = [
  "routing-routes-matchers-and-navigation.md", "route-typed-url-inputs.md",
  "router-navigation-live-selection.md", "navigation-as-an-effect-service.md",
  "integrating-matcher-with-effect-http.md",
] as const;
const readGuide = (fileName: string) => parseGuideDocumentation(fileName,
  fs.readFileSync(path.join(websiteRoot, "content/guides", fileName), "utf8"));
const examples = (fileName: string) => extractTypeScriptFences(readGuide(fileName).body).join("\n");
const moduleLinks = (body: string) => [...body.matchAll(/\/reference\/modules\/([^\s)"#]+)/gu)]
  .map(([, specifier]) => decodeURIComponent(specifier!));
const importedNames = (code: string, specifier: string): ReadonlyArray<string> => {
  const source = ts.createSourceFile("example.ts", code, ts.ScriptTarget.Latest, true);
  return source.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)
      || statement.moduleSpecifier.text !== specifier) return [];
    const bindings = statement.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings)
      ? bindings.elements.map((element) => element.propertyName?.text ?? element.name.text)
      : [];
  });
};

describe("application and platform guides", () => {
  it("links routing lessons to public contracts without duplicating the reference in every example", () => {
    const lessons = routingFiles.map(readGuide);
    const linked = new Set(lessons.flatMap(({ body }) => moduleLinks(body)));
    for (const specifier of ["@typed/router/Route", "@typed/router/AST", "@typed/router/Matcher",
      "@typed/navigation/Navigation", "@typed/navigation/Blocking", "@typed/ui/HttpRouter"]) {
      expect(linked.has(specifier), `Missing public reference for ${specifier}`).toBe(true);
    }
    for (const guide of lessons) {
      expect(guide.title.trim(), guide.slug).not.toBe("");
      expect(guide.summary.trim(), guide.slug).not.toBe("");
      expect(["concept", "guide", "deep-dive"], guide.slug).toContain(guide.kind);
      expect(extractTypeScriptFences(guide.body).length, guide.slug).toBeGreaterThan(0);
    }
    for (const file of routingFiles.slice(1)) {
      expect(lessons[0]!.body).toContain(`/explore/${file.slice(0, -3)}`);
    }
  });

  it("demonstrates typed inputs, live selection, history, and HTTP at their own boundaries", () => {
    const route = examples("route-typed-url-inputs.md");
    for (const api of ["Router.Parse", "Router.Int", "Router.ParamWithSchema", "Router.Type", "Schema.decodeEffect", "Schema.encodeEffect", ".paramsSchema"]) {
      expect(route, `URL contract example: ${api}`).toContain(api);
    }
    const router = examples("router-navigation-live-selection.md");
    for (const api of ["Router.match", "Fx.switchMapEffect", ".layout(", ".catchTag(", ".redirectTo(", "Router.CurrentRoute.extend"]) {
      expect(router, `Live selection example: ${api}`).toContain(api);
    }
    const navigation = examples("navigation-as-an-effect-service.md");
    for (const api of ["Navigation.navigate", "Navigation.currentEntry", "Navigation.transition", "useBlockNavigation", "Uuid7State", "initialMemory"]) {
      expect(navigation, `History example: ${api}`).toContain(api);
    }
    const http = examples("integrating-matcher-with-effect-http.md");
    for (const api of ["ssrForHttp", "streamingSsrForHttp", "handleHttpServerError", "HttpRouter.serve", "HttpClient.get"]) {
      expect(http, `HTTP example: ${api}`).toContain(api);
    }
    const all = routingFiles.map(examples).join("\n");
    expect(importedNames(all, "@typed/router/RouterTest")).toContain("TestRouter");
    expect(importedNames(all, "@typed/router/Router")).not.toContain("TestRouter");
    expect(all).toContain('import * as Router from "@typed/router"');
    expect(all).not.toContain("Matcher.empty");
    expect(all).not.toContain("Router.empty");
    expect(all).not.toContain("FindMyWay");
    expect(all).not.toContain("Ids.Test(");
  });

  it("uses Effect's Vitest harness without prescribing every test's execution style", () => {
    const code = examples("testing-typed-systems.md");
    expect(importedNames(code, "@effect/vitest")).toContain("it");
    expect(code).toContain("it.effect(");
    expect(code).toMatch(/expect\(/u);
  });

  it("compiles every routing and testing example, preserving explicit multi-file boundaries", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".routing-guides-check-"));
    try {
      const files = [...routingFiles, "testing-typed-systems.md"].flatMap((fileName) => {
        const guide = readGuide(fileName);
        const names = new Set<string>();
        return extractTypeScriptFenceDocuments(guide.body).map(({ code, extension, fileName }, index) => {
          const name = fileName ?? `${index}.${extension}`;
          expect(names.has(name), `${guide.slug}: duplicate example file ${name}`).toBe(false);
          names.add(name);
          const file = path.join(staging, guide.slug, name);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, code);
          return file;
        });
      });
      const program = ts.createProgram(files, {
        esModuleInterop: true, module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext, noEmit: true,
        skipLibCheck: true, strict: true, target: ts.ScriptTarget.ES2022,
      });
      expect(ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => websiteRoot,
        getNewLine: () => "\n",
      })).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }, 60_000);
});
