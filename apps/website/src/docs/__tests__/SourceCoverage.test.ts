import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { validateCoverage } from "../Coverage.js";
import { extractPublicModules } from "../Extract.js";
import { discoverPublishedPackages, resolvePublicModules } from "../Published.js";
import { buildReferenceInventory, projectSymbols } from "../Reference.js";
import { validateMarkdownFences } from "../RenderMarkdown.js";
import { documentationSchema } from "../Schema.js";
import { buildSearchArtifact, searchDocumentation } from "../Search.js";

const workspaceRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

const createWorkspace = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const packages = yield* discoverPublishedPackages(workspaceRoot);
      const targets = (yield* Effect.forEach(packages, resolvePublicModules, {
        concurrency: 4,
      })).flat();
      const extraction = extractPublicModules(targets, { repositoryRoot: workspaceRoot });
      return { packages, targets, extraction };
    }).pipe(Effect.provide(NodeFileSystem.layer)),
  );
let workspace: ReturnType<typeof createWorkspace> | undefined;
const loadWorkspace = () => (workspace ??= createWorkspace());

describe("exhaustive source-first documentation coverage", () => {
  it("uses the independently discovered public graph as the complete reference inventory", async () => {
    const { packages, targets, extraction } = await loadWorkspace();
    const inventory = buildReferenceInventory(packages, targets, extraction);
    const structural = validateCoverage(extraction.expectedExposures, extraction);

    expect(structural).toEqual([]);
    expect(inventory.exposures.map(({ id }) => id)).toEqual(
      extraction.expectedExposures.map(({ id }) => id),
    );
    expect(inventory.exposures.length).toBeGreaterThan(1_000);
    expect(inventory.packages).toHaveLength(13);
    expect(inventory.packages.map(({ packageName }) => packageName)).toEqual(
      expect.arrayContaining(["@typed/react", "@typed/svelte", "@typed/vue"]),
    );
    expect(inventory.packages.some(({ packageName }) => packageName === "@typed/astro")).toBe(true);
    expect(inventory.modules).toHaveLength(targets.length);
    expect(inventory.modules.length).toBeGreaterThan(100);
    expect(new Set(inventory.exposures.map(({ id }) => id)).size).toBe(inventory.exposures.length);
    expect(inventory.resources).toHaveLength(4);
    const fxPackage = inventory.packages.find(({ packageName }) => packageName === "@typed/fx");
    const expectedFxModules = [
      "@typed/fx",
      "@typed/fx/Fx",
      "@typed/fx/Push",
      "@typed/fx/RefArray",
      "@typed/fx/RefBigDecimal",
      "@typed/fx/RefBigInt",
      "@typed/fx/RefBoolean",
      "@typed/fx/RefCause",
      "@typed/fx/RefChunk",
      "@typed/fx/RefDateTime",
      "@typed/fx/RefDuration",
      "@typed/fx/RefGraph",
      "@typed/fx/RefHashMap",
      "@typed/fx/RefHashRing",
      "@typed/fx/RefHashSet",
      "@typed/fx/RefIterable",
      "@typed/fx/RefOption",
      "@typed/fx/RefRecord",
      "@typed/fx/RefResult",
      "@typed/fx/RefString",
      "@typed/fx/RefStruct",
      "@typed/fx/RefSubject",
      "@typed/fx/RefTrie",
      "@typed/fx/RefTuple",
      "@typed/fx/Sink",
      "@typed/fx/Subject",
      "@typed/fx/Versioned",
    ];
    expect(fxPackage?.moduleSpecifiers.toSorted()).toEqual(expectedFxModules);
    expect(
      fxPackage?.moduleGroups.flatMap(({ modules }) =>
        modules.map(({ consumerSpecifier }) => consumerSpecifier),
      ),
    ).toEqual(expectedFxModules);
    const exposureIds = new Set(inventory.exposures.map(({ id }) => id));
    for (const id of [
      "@typed/async-data#Refreshing",
      "@typed/id#CuidSeed",
      "@typed/id/Cuid#CuidSeed",
      "@typed/id#Uuid7Seed",
      "@typed/id/Uuid7#Uuid7Seed",
      "@typed/id/IdsTest#IdsTestOptions",
      "@typed/id#Ids",
      "@typed/id/Ids#Ids",
    ]) {
      expect(exposureIds.has(id), id).toBe(true);
    }
    const structuralMemberFamilies = new Set([
      "constructor",
      "method",
      "property",
      "accessor",
      "call-signature",
      "construct-signature",
      "index-signature",
      "enum-member",
    ]);
    expect(
      inventory.exposures
        .filter(
          (exposure) =>
            exposure.recordKind === "declaration" && structuralMemberFamilies.has(exposure.family),
        )
        .map(({ id }) => id),
    ).toEqual([]);
    for (const id of [
      "@typed/async-data#Refreshing.progress",
      "@typed/id#CuidSeed.timestamp",
      "@typed/id/Cuid#CuidSeed.random",
      "@typed/id#Uuid7Seed.randomBytes",
      "@typed/id/Uuid7#Uuid7Seed.seq",
      "@typed/id/IdsTest#IdsTestOptions.currentTime",
      "@typed/id/IdsTest#IdsTestOptions.envData",
      "@typed/id#Ids.uuid5.[[call]]",
      "@typed/id#Ids.uuid5.dns",
      "@typed/id/Ids#Ids.uuid5.x500",
    ]) {
      expect(exposureIds.has(id), id).toBe(false);
    }
    expect(extraction.declarations.every(({ name }) => !name.includes(workspaceRoot))).toBe(true);
    const exposureById = new Map(inventory.exposures.map((exposure) => [exposure.id, exposure]));
    const refSubjectExposure = exposureById.get("@typed/fx#RefSubject");
    expect(refSubjectExposure?.recordKind).toBe("declaration");
    if (refSubjectExposure?.recordKind !== "declaration") {
      throw new Error("Missing @typed/fx#RefSubject declaration exposure.");
    }
    const refSubjectDeclaration = extraction.declarations.find(
      ({ declarationKey }) => declarationKey === refSubjectExposure.declarationKey,
    );
    expect(refSubjectDeclaration?.signatures).toEqual(["namespace RefSubject"]);

    const sourceFileNamespaces = extraction.declarations.filter(({ facets }) =>
      facets.some(({ syntaxKind }) => syntaxKind === "SourceFile"),
    );
    expect(sourceFileNamespaces.length).toBeGreaterThan(0);
    for (const declaration of sourceFileNamespaces) {
      expect(declaration.signatures.join("\n").length, declaration.name).toBeLessThanOrEqual(120);
      expect(declaration.signatures.join("\n"), declaration.name).not.toContain("export declare");
    }
  }, 30_000);

  it("derives package, module, category, and representation routes from that inventory", async () => {
    const { packages, targets, extraction } = await loadWorkspace();
    const inventory = buildReferenceInventory(packages, targets, extraction);
    const routeIds = new Set(inventory.routes.map(({ id }) => id));

    expect(inventory.routes).toHaveLength(
      inventory.packages.length + inventory.modules.length + inventory.exposures.length,
    );
    expect(inventory.routes.filter(({ kind }) => kind === "exposure").map(({ id }) => id)).toEqual(
      inventory.exposures.map(({ id }) => id),
    );
    expect(inventory.modules.every(({ categories }) => categories.length > 0)).toBe(true);
    expect(
      inventory.routes.every(
        ({ canonicalPath, markdownPath, jsonPath }) =>
          canonicalPath.startsWith("/reference/") &&
          markdownPath.startsWith("/docs/reference/") &&
          markdownPath.endsWith(".md") &&
          jsonPath.startsWith("/docs/reference/") &&
          jsonPath.endsWith(".json"),
      ),
    ).toBe(true);
    expect(routeIds).toContain("@typed/fx/Fx#Fx");
    expect(routeIds).toContain("@typed/tsconfig/base#$resource");
    expect(routeIds).toContain("module:@typed/template/RenderEvent");
    expect(routeIds).toContain("package:@typed/ui");
  }, 30_000);

  it("writes one collision-free Markdown/JSON pair whose payload ID matches every route", async () => {
    const { packages, targets, extraction } = await loadWorkspace();
    const inventory = buildReferenceInventory(packages, targets, extraction);
    const equivalence = inventory.routes.map(({ jsonPath }) =>
      path.basename(jsonPath).normalize("NFD").toLocaleLowerCase(),
    );

    expect(new Set(equivalence).size).toBe(equivalence.length);
    for (const route of inventory.routes) {
      const markdown = path.join(workspaceRoot, "apps/website/public", route.markdownPath);
      const json = path.join(workspaceRoot, "apps/website/public", route.jsonPath);
      expect(fs.existsSync(markdown), route.markdownPath).toBe(true);
      expect(fs.existsSync(json), route.jsonPath).toBe(true);
      expect(validateMarkdownFences(fs.readFileSync(markdown, "utf8")), route.markdownPath).toEqual(
        [],
      );
      const payload = JSON.parse(fs.readFileSync(json, "utf8"));
      expect(payload.id, route.jsonPath).toBe(route.id);
      if (route.kind === "exposure") {
        expect(payload.exposure.id, route.jsonPath).toBe(route.id);
        expect(typeof payload.canonicalId, route.jsonPath).toBe("string");
        if (payload.exposure.recordKind === "declaration") {
          expect(payload.declaration.declarationKey, route.jsonPath).toBe(
            payload.exposure.declarationKey,
          );
        }
      }
    }
    const schemaPath = path.join(
      workspaceRoot,
      "apps/website/public/schemas/documentation-v1.json",
    );
    expect(fs.existsSync(schemaPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(schemaPath, "utf8")).$id).toBe(documentationSchema.$id);
  }, 30_000);

  it("projects every exposure into searchable documentation without structural filtering", async () => {
    const { packages, targets, extraction } = await loadWorkspace();
    const inventory = buildReferenceInventory(packages, targets, extraction);
    const symbols = projectSymbols(inventory);
    const artifact = buildSearchArtifact(
      {
        schemaVersion: 1,
        repositoryRevision: "test",
        packages: [],
        guides: [],
        glossary: [],
        symbols,
      },
      inventory,
    );

    expect(symbols).toHaveLength(inventory.exposures.length);
    expect(artifact.entries).toHaveLength(
      inventory.packages.length + inventory.modules.length + inventory.exposures.length,
    );
    expect(artifact.entries.filter(({ kind }) => kind === "exposure").map(({ id }) => id)).toEqual(
      inventory.exposures
        .filter(({ recordKind }) => recordKind === "declaration")
        .map(({ id }) => id),
    );
    expect(new Set(artifact.entries.map(({ kind }) => kind))).toEqual(
      new Set(["package", "module", "exposure", "resource"]),
    );
    expect(JSON.stringify(artifact)).not.toContain("## Ownership and lifetime");
    expect(Buffer.byteLength(JSON.stringify(artifact))).toBeLessThan(12_000_000);
    expect(searchDocumentation(artifact, "DomRenderEvnt")[0]?.id).toContain("DomRenderEvent");
    expect(searchDocumentation(artifact, "DomRendrEvnt")[0]?.id).toContain("DomRenderEvent");
    expect(
      searchDocumentation(artifact, "tsconfig base").some(({ id }) =>
        id.includes("@typed/tsconfig/base#$resource"),
      ),
    ).toBe(true);
  }, 30_000);

  it("emits complete, comment-free, bounded, parseable signatures for the whole corpus", async () => {
    const { packages, targets, extraction } = await loadWorkspace();
    const inventory = buildReferenceInventory(packages, targets, extraction);
    const symbols = projectSymbols(inventory);
    const exposures = new Map(inventory.exposures.map((exposure) => [exposure.id, exposure]));
    const bareContainer =
      /^(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?(?:class|interface|enum|namespace)\s+[\w$]+(?:\s*<[^>{}]*>)?(?:\s+extends\s+[^{}]+)?$/su;
    const failures: Array<string> = [];

    for (const symbol of symbols) {
      const exposure = exposures.get(symbol.id);
      if (exposure?.recordKind !== "declaration") continue;
      if (symbol.signatures.length === 0) failures.push(`${symbol.id}: no signatures`);
      for (const signature of symbol.signatures) {
        if (signature.trim() === "") failures.push(`${symbol.id}: blank signature`);
        if (/\/\*|(^|\n)\s*\/\//u.test(signature)) {
          failures.push(`${symbol.id}: declaration comment leaked into signature`);
        }
        if (bareContainer.test(signature.trim())) {
          failures.push(`${symbol.id}: container declaration has no body`);
        }
        if (signature.length > 8_000) failures.push(`${symbol.id}: signature exceeds 8000 bytes`);
        if (signature.split("\n").some((line) => line.length > 800)) {
          failures.push(`${symbol.id}: signature line exceeds 800 columns`);
        }

        const contextualSource =
          exposure.family === "constructor"
            ? `declare class Signature { ${signature} }`
            : exposure.family === "method" ||
                exposure.family === "property" ||
                exposure.family === "accessor"
              ? exposure.static || /^(?:public|protected|private|static)\b/u.test(signature.trim())
                ? `declare class Signature { ${signature} }`
                : `interface Signature { ${signature} }`
              : exposure.family === "call-signature" ||
                  exposure.family === "construct-signature" ||
                  exposure.family === "index-signature"
                ? `interface Signature { ${signature} }`
                : exposure.family === "enum-member"
                  ? `declare enum Signature { ${signature} }`
                  : signature;
        const candidates = [
          contextualSource,
          `interface Signature { ${signature} }`,
          `declare class Signature { ${signature} }`,
        ];
        const diagnostics = candidates.map((source) => {
          const parsed = ts.createSourceFile(
            "signature.d.ts",
            source,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
          ) as ts.SourceFile & { readonly parseDiagnostics: ReadonlyArray<ts.Diagnostic> };
          return parsed.parseDiagnostics;
        });
        if (diagnostics.every((candidate) => candidate.length > 0)) {
          failures.push(
            `${symbol.id}: ${ts.flattenDiagnosticMessageText(diagnostics[0]![0]!.messageText, " ")}`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  }, 30_000);
});
