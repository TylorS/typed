import { NodeFileSystem } from "@effect/platform-node";
import { Effect, FileSystem, Schema } from "effect";
import * as nodeFs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { canonicalSiteOrigin } from "../src/Site.js";
import { siteHref } from "../src/SiteHref.js";
import { resolveMarkdownLinks } from "../src/docs/MarkdownLinks.js";
import { curriculumSearchEntries } from "../src/tutorial/Content.js";
import { validateCoverage } from "../src/docs/Coverage.js";
import { replaceDirectoriesTransactionally } from "../src/docs/AtomicDirectories.js";
import { extractPublicModules } from "../src/docs/Extract.js";
import { validateFxMarbleCoverage } from "../src/docs/FxMarbleCoverage.js";
import {
  fxNonTemporalExports,
  renderFxOperatorAtlasMarkdown,
} from "../src/docs/FxOperatorAtlas.js";
import {
  loadGlossaryContent,
  loadRecipeContent,
  parseGuideDocumentation,
} from "../src/docs/Frontmatter.js";
import {
  DocumentationModelSchema,
  PublicApiExtractionSchema,
  ReferenceInventorySchema,
  type DocumentationModel,
  type PackageDocumentation,
  type ReferenceInventory,
  type SymbolDocumentation,
} from "../src/docs/Model.js";
import { discoverPublishedPackages, resolvePublicModules } from "../src/docs/Published.js";
import {
  buildReferenceInventory,
  canonicalReferencePath,
  projectSymbols,
  referencePath,
  referenceSlug,
} from "../src/docs/Reference.js";
import { renderSymbolMarkdown, validateMarkdownFences } from "../src/docs/RenderMarkdown.js";
import { documentationSchema } from "../src/docs/Schema.js";
import { buildSearchArtifact, canonicalExposureIds } from "../src/docs/Search.js";
import {
  extractTypeScriptFenceDocuments,
  validateAuthoredExampleQuality,
  validateRecipeExamples,
  type AuthoredExampleDocumentation,
} from "../src/docs/RecipeValidation.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(root, "../..");
const contentGuides = path.join(root, "content/guides");
const contentGlossary = path.join(root, "content/glossary");
const contentRecipes = path.join(root, "content/recipes");
const generated = path.join(root, "src/generated");
const publicDocs = path.join(root, "public/docs");
const publicSchemas = path.join(root, "public/schemas");
const legacyPublicReference = path.join(root, "public/reference");

// Machine-readable documents can be consumed away from the website. Keep their prose
// links absolute and canonical while leaving executable examples untouched.
const canonicalSite = new URL(canonicalSiteOrigin);
const artifactUrl = (pathname: string): string =>
  new URL(siteHref(canonicalReferencePath(pathname), canonicalSite.pathname), canonicalSite.origin)
    .href;
const artifactMarkdown = (markdown: string): string => resolveMarkdownLinks(markdown, artifactUrl);

const moduleName = (specifier: string, packageName: string): string =>
  specifier === packageName ? "." : specifier.slice(packageName.length + 1);

const legacyPackages = (
  inventory: ReferenceInventory,
  symbols: ReadonlyArray<SymbolDocumentation>,
): ReadonlyArray<PackageDocumentation> =>
  inventory.packages.map((pkg) => ({
    packageName: pkg.packageName,
    version: pkg.packageVersion,
    modules: inventory.modules
      .filter(({ packageName }) => packageName === pkg.packageName)
      .map((module) => ({
        name: moduleName(module.consumerSpecifier, module.packageName),
        exportPath: module.exportSubpath,
        sourceFile: module.consumerSpecifier,
      })),
    symbols: symbols.filter(({ packageName }) => packageName === pkg.packageName),
  }));

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const generatedModule = (imports: string, values: Readonly<Record<string, unknown>>): string =>
  `${imports}\n\n${Object.entries(values)
    .map(
      ([name, value]) =>
        `export const ${name} = JSON.parse(${JSON.stringify(JSON.stringify(value))}) as ${name === "referenceInventory" ? "ReferenceInventory" : name === "packages" ? "ReadonlyArray<PackageDocumentation>" : "ReadonlyArray<SymbolDocumentation>"};`,
    )
    .join("\n\n")}\n`;

const packageMarkdown = (inventory: ReferenceInventory, packageName: string): string => {
  const pkg = inventory.packages.find((candidate) => candidate.packageName === packageName)!;
  return `# ${packageName}\n\nVersion ${pkg.packageVersion}. ${pkg.uniqueExportCount} unique exports across ${pkg.moduleSpecifiers.length} modules.\n\n${pkg.moduleSpecifiers
    .map((specifier) => `- [${specifier}](/reference/modules/${encodeURI(specifier)})`)
    .join("\n")}\n`;
};

const moduleMarkdown = (inventory: ReferenceInventory, consumerSpecifier: string): string => {
  const module = inventory.modules.find(
    (candidate) => candidate.consumerSpecifier === consumerSpecifier,
  )!;
  return `# ${consumerSpecifier}\n\n${module.uniqueExportCount} unique exports.\n\n${module.categories
    .map(
      (category) =>
        `## ${category.name}\n\n${category.exposureIds
          .map((id) => `- [${id.slice(id.indexOf("#") + 1)}](${referencePath(id)})`)
          .join("\n")}`,
    )
    .join("\n\n")}\n`;
};

const fullReferenceMarkdown = (
  inventory: ReferenceInventory,
  symbols: ReadonlyArray<SymbolDocumentation>,
): string =>
  artifactMarkdown(
    [
      "# Typed complete API reference",
      "Every public exposure is included with its own identity, signatures, documentation, and examples. Re-exported aliases remain included so each supported import path can be inspected independently.",
      "# Packages",
      ...inventory.packages.map((pkg) => packageMarkdown(inventory, pkg.packageName)),
      "# Modules",
      ...inventory.modules.map((module) => moduleMarkdown(inventory, module.consumerSpecifier)),
      "# Public API",
      ...symbols.map(
        (symbol) =>
          `[Public API: ${symbol.id}](${referencePath(symbol.id)})\n\n${renderSymbolMarkdown(symbol)}`,
      ),
    ].join("\n\n---\n\n"),
  );

const deploymentPathKey = (value: string): string => value.normalize("NFD").toLowerCase();

const validateMarkdownTree = (root: string): void => {
  for (const entry of nodeFs.readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const file = path.join(entry.parentPath, entry.name);
    const errors = validateMarkdownFences(nodeFs.readFileSync(file, "utf8"));
    if (errors.length > 0) throw new Error(`${file}: ${errors.join("; ")}`);
  }
};

const validateReferenceStage = (
  referenceStage: string,
  routes: ReferenceInventory["routes"],
): void => {
  const relativePath = (documentPath: string): string => {
    const prefix = "/docs/reference/";
    if (!documentPath.startsWith(prefix)) {
      throw new Error(`Reference document is outside ${prefix}: ${documentPath}`);
    }
    return documentPath.slice(prefix.length);
  };
  const expectedPaths = routes.flatMap(({ markdownPath, jsonPath }) => [
    relativePath(markdownPath),
    relativePath(jsonPath),
  ]);
  const deploymentPaths = expectedPaths.map(deploymentPathKey);
  if (new Set(deploymentPaths).size !== deploymentPaths.length) {
    throw new Error("Reference artifact paths collide on a case-insensitive normalized filesystem");
  }
  for (const route of routes) {
    const markdown = path.join(referenceStage, relativePath(route.markdownPath));
    const jsonPath = path.join(referenceStage, relativePath(route.jsonPath));
    if (!nodeFs.existsSync(markdown)) throw new Error(`Missing reference artifact: ${markdown}`);
    if (!nodeFs.existsSync(jsonPath)) throw new Error(`Missing reference artifact: ${jsonPath}`);
    const payload = JSON.parse(nodeFs.readFileSync(jsonPath, "utf8")) as { readonly id?: unknown };
    if (payload.id !== route.id) {
      throw new Error(`Reference payload ID mismatch at ${jsonPath}: expected ${route.id}`);
    }
  }
};

const validateAuthoredExampleCompilation = (
  documents: ReadonlyArray<AuthoredExampleDocumentation>,
): void => {
  const staging = nodeFs.mkdtempSync(path.join(root, ".recipe-check-"));
  const files: Array<string> = [];
  const vueFiles: Array<string> = [];
  try {
    for (const document of documents) {
      for (const [index, { code, extension, fileName }] of extractTypeScriptFenceDocuments(
        document.body,
      ).entries()) {
        const file = path.join(staging, document.slug, fileName ?? `${index}.${extension}`);
        if (files.includes(file) || vueFiles.includes(file))
          throw new Error(`Duplicate example file: ${document.slug}/${fileName}`);
        nodeFs.mkdirSync(path.dirname(file), { recursive: true });
        nodeFs.writeFileSync(file, code);
        (document.slug === "vue" ? vueFiles : files).push(file);
      }
    }
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
      if (diagnostics.length > 0) {
        throw new Error(
          `Authored examples do not compile:\n${ts.formatDiagnosticsWithColorAndContext(
            diagnostics,
            {
              getCanonicalFileName: (fileName) => fileName,
              getCurrentDirectory: () => root,
              getNewLine: () => "\n",
            },
          )}`,
        );
      }
    }
  } finally {
    nodeFs.rmSync(staging, { recursive: true, force: true });
  }
};

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString(
    path.join(contentGuides, "fx-operator-atlas.md"),
    [
      "---",
      "title: The Fx marble atlas",
      "summary: Trace values, errors, completion and cancellation through every public Fx operation.",
      "section: Fx",
      "kind: deep-dive",
      "order: 1.99",
      "---",
      "",
      renderFxOperatorAtlasMarkdown(),
      "",
    ].join("\n"),
  );
  const guideFiles = (yield* fs.readDirectory(contentGuides))
    .filter((fileName) => fileName.endsWith(".md"))
    .sort();
  const guides = yield* Effect.forEach(guideFiles, (fileName) =>
    fs
      .readFileString(path.join(contentGuides, fileName))
      .pipe(Effect.map((source) => parseGuideDocumentation(fileName, source))),
  );
  guides.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  const glossary = loadGlossaryContent(contentGlossary);
  const recipes = loadRecipeContent(contentRecipes);
  const authoredExampleErrors = validateAuthoredExampleQuality([...guides, ...recipes]);
  if (authoredExampleErrors.length > 0) {
    throw new Error(
      `Authored examples contain compile-only scaffolding:\n${authoredExampleErrors.join("\n")}`,
    );
  }
  const recipeErrors = validateRecipeExamples(recipes);
  if (recipeErrors.length > 0) {
    throw new Error(`Recipe validation failed:\n${recipeErrors.join("\n")}`);
  }
  validateAuthoredExampleCompilation([...guides, ...recipes]);
  const publishedPackages = yield* discoverPublishedPackages(workspaceRoot);
  const targets = (yield* Effect.forEach(publishedPackages, resolvePublicModules, {
    concurrency: 4,
  })).flat();
  const extraction = extractPublicModules(targets, { repositoryRoot: workspaceRoot });
  Schema.decodeUnknownSync(PublicApiExtractionSchema)(extraction);
  const structuralDiagnostics = validateCoverage(extraction.expectedExposures, extraction);
  if (structuralDiagnostics.length > 0) {
    throw new Error(
      `Public API coverage failed:\n${structuralDiagnostics.map(({ message }) => message).join("\n")}`,
    );
  }
  const inventory = buildReferenceInventory(publishedPackages, targets, extraction);
  Schema.decodeUnknownSync(ReferenceInventorySchema)(inventory);
  const fxModule = inventory.modules.find(
    ({ consumerSpecifier }) => consumerSpecifier === "@typed/fx/Fx",
  );
  if (!fxModule) throw new Error("The public @typed/fx/Fx module is missing.");
  const nonTemporal = new Set(fxNonTemporalExports.map(({ name }) => name));
  const fxRuntimeNames = fxModule.exposureIds
    .map((id) => id.slice(id.indexOf("#") + 1))
    .filter((name) => !name.includes(".") && !nonTemporal.has(name));
  const fxMarbleCoverage = validateFxMarbleCoverage(
    fxRuntimeNames,
    guides.filter(({ slug }) => slug === "fx-operator-atlas"),
  );
  if (
    fxMarbleCoverage.missing.length > 0 ||
    fxMarbleCoverage.unexpected.length > 0 ||
    fxMarbleCoverage.duplicates.length > 0
  ) {
    throw new Error(
      [
        "The Fx atlas must depict every public constructor, combinator, interop adapter and runner.",
        `Missing: ${fxMarbleCoverage.missing.join(", ") || "none"}`,
        `Unexpected: ${fxMarbleCoverage.unexpected.join(", ") || "none"}`,
        `Duplicated: ${fxMarbleCoverage.duplicates.join(", ") || "none"}`,
      ].join("\n"),
    );
  }
  const symbols = projectSymbols(inventory);
  const packages = legacyPackages(inventory, symbols);
  const documentationModel: DocumentationModel = {
    schemaVersion: 1,
    repositoryRevision: "working-tree",
    packages,
    guides,
    glossary,
    symbols,
  };
  Schema.decodeUnknownSync(DocumentationModelSchema)(documentationModel);
  const searchArtifact = buildSearchArtifact(
    documentationModel,
    inventory,
    curriculumSearchEntries,
  );
  const manifest = {
    schemaVersion: 1,
    repositoryRevision: documentationModel.repositoryRevision,
    canonical: canonicalSiteOrigin,
    counts: {
      packages: inventory.packages.length,
      modules: inventory.modules.length,
      uniqueExports: inventory.uniqueExportCount,
      declarations: inventory.declarations.length,
      resources: inventory.resources.length,
    },
    routes: inventory.routes,
    schema: documentationSchema.$id,
  };

  const generatedStage = nodeFs.mkdtempSync(path.join(path.dirname(generated), ".generated-"));
  const docsStage = nodeFs.mkdtempSync(path.join(path.dirname(publicDocs), ".docs-"));
  const schemasStage = nodeFs.mkdtempSync(path.join(path.dirname(publicSchemas), ".schemas-"));
  try {
    nodeFs.mkdirSync(path.join(docsStage, "guides"), { recursive: true });
    const referenceStage = path.join(docsStage, "reference");
    nodeFs.mkdirSync(path.join(referenceStage, "packages"), { recursive: true });
    nodeFs.mkdirSync(path.join(referenceStage, "modules"), { recursive: true });
    nodeFs.mkdirSync(path.join(referenceStage, "exposures"), { recursive: true });
    nodeFs.writeFileSync(
      path.join(generatedStage, "guides.ts"),
      `import type { GuideDocumentation } from "../docs/Model.js";\n\nexport const guides: ReadonlyArray<GuideDocumentation> = ${JSON.stringify(guides, null, 2)};\n`,
    );
    nodeFs.writeFileSync(
      path.join(generatedStage, "glossary.ts"),
      `import type { GlossaryEntry } from "../docs/Model.js";\n\nexport const glossaryEntries: ReadonlyArray<GlossaryEntry> = ${JSON.stringify(glossary, null, 2)};\n`,
    );
    nodeFs.writeFileSync(
      path.join(generatedStage, "recipes.ts"),
      `import type { RecipeDocumentation } from "../docs/Recipes.js";\n\nexport const recipes: ReadonlyArray<RecipeDocumentation> = ${JSON.stringify(recipes, null, 2)};\n`,
    );
    nodeFs.writeFileSync(
      path.join(generatedStage, "reference.ts"),
      generatedModule(
        `import type { PackageDocumentation, ReferenceInventory, SymbolDocumentation } from "../docs/Model.js";`,
        { packages, symbols, referenceInventory: inventory },
      ),
    );
    nodeFs.writeFileSync(path.join(generatedStage, "docs.json"), json(documentationModel));
    nodeFs.writeFileSync(path.join(generatedStage, "reference.json"), json(inventory));
    nodeFs.writeFileSync(path.join(generatedStage, "search-index.json"), json(searchArtifact));
    nodeFs.writeFileSync(
      path.join(generatedStage, "search.ts"),
      `import type { SearchArtifact } from "../docs/Search.js";\n\nexport const searchArtifact = JSON.parse(${JSON.stringify(JSON.stringify(searchArtifact))}) as SearchArtifact;\n`,
    );
    nodeFs.writeFileSync(path.join(generatedStage, "docs.schema.json"), json(documentationSchema));
    nodeFs.writeFileSync(path.join(generatedStage, "manifest.json"), json(manifest));
    nodeFs.writeFileSync(
      path.join(generatedStage, "manifest.ts"),
      `export interface GeneratedManifest { readonly schemaVersion: number; readonly repositoryRevision: string; readonly canonical: string; readonly counts: Readonly<Record<string, number>>; readonly routes: ReadonlyArray<{ readonly kind: string; readonly id: string; readonly canonicalPath: string; readonly markdownPath: string; readonly jsonPath: string }>; readonly schema: string }\n\nexport const generatedManifest = JSON.parse(${JSON.stringify(JSON.stringify(manifest))}) as GeneratedManifest;\n`,
    );
    nodeFs.writeFileSync(
      path.join(generatedStage, "catalog.ts"),
      `export const packageCatalog = ${JSON.stringify(
        inventory.packages.map((pkg) => ({
          packageName: pkg.packageName,
          packageVersion: pkg.packageVersion,
          moduleCount: pkg.moduleSpecifiers.length,
          uniqueExportCount: pkg.uniqueExportCount,
        })),
        null,
        2,
      )} as const;\n\nexport const referenceCounts = ${JSON.stringify({
        packageCount: inventory.packages.length,
        moduleCount: inventory.modules.length,
        uniqueExportCount: inventory.uniqueExportCount,
      })} as const;\n`,
    );
    for (const guide of guides) {
      nodeFs.writeFileSync(
        path.join(docsStage, "guides", `${guide.slug}.md`),
        artifactMarkdown(`${guide.body}\n`),
      );
    }
    for (const pkg of inventory.packages) {
      const name = referenceSlug(`package:${pkg.packageName}`);
      nodeFs.writeFileSync(
        path.join(referenceStage, "packages", `${name}.md`),
        artifactMarkdown(packageMarkdown(inventory, pkg.packageName)),
      );
      nodeFs.writeFileSync(
        path.join(referenceStage, "packages", `${name}.json`),
        json({ id: `package:${pkg.packageName}`, package: pkg }),
      );
    }
    for (const module of inventory.modules) {
      const name = referenceSlug(`module:${module.consumerSpecifier}`);
      nodeFs.writeFileSync(
        path.join(referenceStage, "modules", `${name}.md`),
        artifactMarkdown(moduleMarkdown(inventory, module.consumerSpecifier)),
      );
      nodeFs.writeFileSync(
        path.join(referenceStage, "modules", `${name}.json`),
        json({ id: `module:${module.consumerSpecifier}`, module }),
      );
    }
    const declarations = new Map(
      inventory.declarations.map((declaration) => [declaration.declarationKey, declaration]),
    );
    const canonicalByDeclaration = canonicalExposureIds(inventory);
    for (const [index, exposure] of inventory.exposures.entries()) {
      const symbol = symbols[index]!;
      const canonicalId =
        exposure.recordKind === "resource"
          ? exposure.id
          : canonicalByDeclaration.get(exposure.declarationKey)!;
      const payload =
        exposure.recordKind === "resource"
          ? { id: exposure.id, canonicalId, symbol, exposure }
          : {
              id: exposure.id,
              canonicalId,
              symbol,
              exposure,
              declaration: declarations.get(exposure.declarationKey),
            };
      const name = referenceSlug(exposure.id);
      nodeFs.writeFileSync(
        path.join(referenceStage, "exposures", `${name}.md`),
        artifactMarkdown(renderSymbolMarkdown(symbol)),
      );
      nodeFs.writeFileSync(path.join(referenceStage, "exposures", `${name}.json`), json(payload));
    }
    nodeFs.writeFileSync(
      path.join(referenceStage, "manifest.json"),
      json({
        ...manifest,
        canonical: artifactUrl("/"),
        routes: inventory.routes.map((route) => ({
          ...route,
          canonicalPath: artifactUrl(route.canonicalPath),
          markdownPath: artifactUrl(route.markdownPath),
          jsonPath: artifactUrl(route.jsonPath),
        })),
      }),
    );
    nodeFs.writeFileSync(
      path.join(referenceStage, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${inventory.routes.map(({ canonicalPath }) => `<url><loc>${artifactUrl(canonicalPath).replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>\n`,
    );
    nodeFs.writeFileSync(
      path.join(referenceStage, "llms.txt"),
      `# Typed API reference\n\n${inventory.packages.map((pkg) => `- [${pkg.packageName}](${artifactUrl(`/reference/packages/${encodeURI(pkg.packageName)}`)}): ${pkg.uniqueExportCount} unique exports`).join("\n")}\n`,
    );
    const completeReference = fullReferenceMarkdown(inventory, symbols);
    const completeReferenceFenceErrors = validateMarkdownFences(completeReference);
    if (completeReferenceFenceErrors.length > 0) {
      throw new Error(
        `Invalid full-reference Markdown: ${completeReferenceFenceErrors.join("; ")}`,
      );
    }
    nodeFs.writeFileSync(path.join(referenceStage, "llms-full.txt"), `${completeReference}\n`);
    nodeFs.writeFileSync(
      path.join(schemasStage, "documentation-v1.json"),
      json(documentationSchema),
    );
    validateMarkdownTree(docsStage);
    validateReferenceStage(referenceStage, inventory.routes);
    replaceDirectoriesTransactionally([
      { staging: generatedStage, destination: generated },
      { staging: docsStage, destination: publicDocs },
      { staging: schemasStage, destination: publicSchemas },
    ]);
    nodeFs.rmSync(legacyPublicReference, { recursive: true, force: true });
  } catch (error) {
    nodeFs.rmSync(generatedStage, { recursive: true, force: true });
    nodeFs.rmSync(docsStage, { recursive: true, force: true });
    nodeFs.rmSync(schemasStage, { recursive: true, force: true });
    throw error;
  }
});

await Effect.runPromise(program.pipe(Effect.provide(NodeFileSystem.layer)));
