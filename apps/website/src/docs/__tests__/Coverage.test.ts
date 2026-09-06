import { describe, expect, it } from "vitest";
import { validateCoverage } from "../Coverage.js";
import type {
  DeclarationExposureRecord,
  DeclarationRecord,
  ExpectedExposure,
  ExtractionDiagnostic,
  PublicApiExtraction,
  ResourceRecord,
  SourceSpan,
} from "../Model.js";

const span: SourceSpan = {
  file: "packages/example/src/index.ts",
  start: { line: 1, column: 1 },
  end: { line: 1, column: 20 },
};

const declaration: DeclarationRecord = {
  declarationKey: "declaration:one",
  name: "canonical",
  family: "function",
  facets: [
    {
      family: "function",
      syntaxKind: "FunctionDeclaration",
      signatures: ["canonical(): void"],
      typeParameters: [],
      sourceSpans: [span],
      static: false,
      readonly: false,
      optional: false,
    },
  ],
  signatures: ["canonical(): void"],
  typeParameters: [],
  summary: "A canonical declaration.",
  sections: {},
  examples: [],
  sourceSpans: [span],
};

const expected = (qualifiedName: string): ExpectedExposure => ({
  id: `@fixture/example#${qualifiedName}`,
  packageName: "@fixture/example",
  consumerSpecifier: "@fixture/example",
  qualifiedName,
});

const exposure = (
  qualifiedName: string,
  options: {
    readonly aliases?: ReadonlyArray<string>;
    readonly declarationKey?: string;
    readonly importedFrom?: string;
    readonly isAlias?: boolean;
  } = {},
): DeclarationExposureRecord => ({
  recordKind: "declaration",
  id: `@fixture/example#${qualifiedName}`,
  packageName: "@fixture/example",
  packageVersion: "1.0.0",
  moduleName: ".",
  consumerSpecifier: "@fixture/example",
  exportName: qualifiedName,
  qualifiedName,
  declarationKey: options.declarationKey ?? declaration.declarationKey,
  family: "function",
  signatures: [`${qualifiedName}(): void`],
  sourceSpans: [span],
  aliases: options.aliases ?? [],
  isAlias: options.isAlias ?? false,
  ...(options.importedFrom === undefined ? {} : { importedFrom: options.importedFrom }),
  static: false,
});

const resource: ResourceRecord = {
  recordKind: "resource",
  id: "@fixture/example/config#$resource",
  packageName: "@fixture/example",
  packageVersion: "1.0.0",
  moduleName: "config",
  consumerSpecifier: "@fixture/example/config",
  exportName: "$resource",
  qualifiedName: "$resource",
  family: "resource",
  mediaType: "application/json",
  raw: "{}\n",
  structured: {},
  extends: [],
  compilerOptions: {},
  usage: '{ "extends": "@fixture/example/config" }\n',
  sourceSpans: [span],
  aliases: [],
  isAlias: false,
};

const extraction = (
  exposures: PublicApiExtraction["exposures"],
  options: {
    readonly declarations?: ReadonlyArray<DeclarationRecord>;
    readonly diagnostics?: ReadonlyArray<ExtractionDiagnostic>;
    readonly resources?: ReadonlyArray<ResourceRecord>;
  } = {},
): PublicApiExtraction => ({
  declarations: options.declarations ?? [declaration],
  exposures,
  resources: options.resources ?? [],
  expectedExposures: [],
  diagnostics: options.diagnostics ?? [],
});

describe("validateCoverage", () => {
  it("accepts exact exposure equality with explicit shared-declaration aliases", () => {
    const canonical = exposure("canonical", { aliases: ["@fixture/example#alias"] });
    const alias = exposure("alias", {
      aliases: ["@fixture/example#canonical"],
      isAlias: true,
      importedFrom: "@fixture/example#canonical",
    });

    expect(
      validateCoverage([expected("canonical"), expected("alias")], extraction([alias, canonical])),
    ).toEqual([]);
  });

  it("reports missing, unexpected, duplicate, and malformed exposure IDs", () => {
    const canonical = exposure("canonical");
    const malformed = {
      ...exposure("unexpected"),
      id: "@fixture/example#wrong-id",
    };
    const diagnostics = validateCoverage(
      [expected("canonical"), expected("missing")],
      extraction([canonical, canonical, malformed]),
    );

    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "duplicate-exposure",
        "invalid-exposure-id",
        "missing-exposure",
        "unexpected-exposure",
      ]),
    );
  });

  it("reports duplicate expected exposure IDs", () => {
    expect(
      validateCoverage(
        [expected("canonical"), expected("canonical")],
        extraction([exposure("canonical")]),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-expected-exposure",
          id: "@fixture/example#canonical",
        }),
      ]),
    );
  });

  it("requires every resource exposure to join the resource registry", () => {
    const expectedResource: ExpectedExposure = {
      id: resource.id,
      packageName: resource.packageName,
      consumerSpecifier: resource.consumerSpecifier,
      qualifiedName: "$resource",
    };

    expect(validateCoverage([expectedResource], extraction([resource]))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-resource-record",
          id: resource.id,
        }),
      ]),
    );
    expect(
      validateCoverage([expectedResource], extraction([resource], { resources: [resource] })),
    ).toEqual([]);
  });

  it("reports dangling declaration keys and aliases without explicit relationships", () => {
    const canonical = exposure("canonical", { declarationKey: "declaration:missing" });
    const alias = exposure("alias", {
      declarationKey: "declaration:missing",
      isAlias: true,
    });
    const diagnostics = validateCoverage(
      [expected("canonical"), expected("alias")],
      extraction([canonical, alias], { declarations: [] }),
    );

    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "missing-declaration",
        "alias-not-explicit",
        "missing-import-source",
      ]),
    );
  });

  it("rejects an alias importedFrom declaration that does not exist", () => {
    const alias = exposure("alias", {
      isAlias: true,
      importedFrom: "declaration:not-real",
    });

    expect(validateCoverage([expected("alias")], extraction([alias]))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-import-source",
          id: "@fixture/example#alias",
        }),
      ]),
    );
  });

  it("rejects alias provenance to a different declaration key", () => {
    const otherDeclaration: DeclarationRecord = {
      ...declaration,
      declarationKey: "declaration:other",
      name: "other",
    };
    const alias = exposure("alias", {
      isAlias: true,
      importedFrom: otherDeclaration.declarationKey,
    });

    expect(
      validateCoverage(
        [expected("alias")],
        extraction([alias], { declarations: [declaration, otherDeclaration] }),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-import-source",
          id: "@fixture/example#alias",
        }),
      ]),
    );
  });

  it("does not manufacture an alias from lexical order alone", () => {
    const first = exposure("first", { aliases: ["@fixture/example#second"] });
    const second = exposure("second", { aliases: ["@fixture/example#first"] });

    expect(
      validateCoverage([expected("first"), expected("second")], extraction([second, first])),
    ).toEqual([]);
  });

  it("keeps published internal and unsupported extraction failures actionable", () => {
    const diagnostics = validateCoverage(
      [expected("canonical")],
      extraction([exposure("canonical")], {
        diagnostics: [
          {
            code: "published-internal",
            packageName: "@fixture/example",
            consumerSpecifier: "@fixture/example",
            qualifiedName: "canonical",
            declarationFamily: "function",
            message: "Published declaration is internal.",
          },
          {
            code: "unsupported-declaration",
            packageName: "@fixture/example",
            consumerSpecifier: "@fixture/example",
            qualifiedName: "future",
            declarationFamily: "unsupported",
            message: "Unsupported declaration.",
          },
        ],
      }),
    );

    expect(diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["published-internal", "unsupported-declaration"]),
    );
  });

  it("treats an authored-source mapping fallback as advisory", () => {
    expect(
      validateCoverage(
        [expected("canonical")],
        extraction([exposure("canonical")], {
          diagnostics: [
            {
              code: "missing-source-map-mapping",
              packageName: "@fixture/example",
              consumerSpecifier: "@fixture/example",
              qualifiedName: "canonical",
              declarationFamily: "function",
              message: "Published declaration span used as a provenance fallback.",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });
});
