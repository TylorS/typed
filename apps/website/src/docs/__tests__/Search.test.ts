import { describe, expect, it } from "vitest";
import type {
  DeclarationExposureRecord,
  DocumentationModel,
  ReferenceInventory,
} from "../Model.js";
import { buildSearchArtifact, searchDocumentation, type SearchEntry } from "../Search.js";

const model: DocumentationModel = {
  schemaVersion: 1,
  repositoryRevision: "search-test",
  packages: [],
  symbols: [],
  guides: [
    {
      slug: "refsubject-model",
      title: "RefSubject: build the model before the view",
      summary: "Model selection before connecting it to a template.",
      body: "",
      headings: [],
      relations: [],
      section: "State",
    },
  ],
  glossary: [
    {
      id: "refsubject",
      term: "RefSubject",
      aliases: [],
      definition: "A current value and its changes.",
      details: "",
      related: [],
      links: [],
    },
  ],
};

const exposure = (
  specifier: string,
  name: string,
  declarationKey: string,
  overrides: Partial<DeclarationExposureRecord> = {},
): DeclarationExposureRecord => ({
  recordKind: "declaration",
  id: `${specifier}#${name}`,
  packageName: "@typed/fx",
  packageVersion: "1.0.0",
  moduleName: ".",
  consumerSpecifier: specifier,
  exportName: name,
  qualifiedName: name,
  declarationKey,
  family: "interface",
  signatures: [],
  sourceSpans: [],
  aliases: [],
  isAlias: false,
  static: false,
  ...overrides,
});

const inventory: ReferenceInventory = {
  uniqueExportCount: 4,
  packages: [],
  modules: [
    {
      packageName: "@typed/fx",
      packageVersion: "1.0.0",
      consumerSpecifier: "@typed/fx/RefSubject",
      exportSubpath: "./RefSubject",
      mediaType: "text/typescript",
      categories: [],
      exposureIds: [],
      uniqueExportCount: 2,
    },
  ],
  declarations: [],
  exposures: [
    exposure("@typed/fx/RefSubject", "RefSubject", "refsubject-type"),
    exposure("@typed/fx", "State", "refsubject-namespace", {
      family: "namespace",
      isAlias: true,
      signatures: ['export * as State from "./RefSubject.js";'],
    }),
    exposure("@typed/fx/RefSubject", "map", "map-function"),
    exposure("@typed/fx", "RefSubject.map", "map-function", { isAlias: true }),
  ],
  resources: [],
  routes: [],
};

describe("documentation search", () => {
  it("groups a module, its main type, a resolved namespace export, and its definition", () => {
    const artifact = buildSearchArtifact(model, inventory);
    const results = searchDocumentation(artifact, "RefSubject");
    expect(results[0]?.id).toBe("module:@typed/fx/RefSubject");
    expect(results[0]?.related?.map(({ id }) => id)).toEqual([
      "glossary:refsubject",
      "@typed/fx/RefSubject#RefSubject",
      "@typed/fx#State",
    ]);
    expect(results.filter(({ title }) => title === "RefSubject")).toHaveLength(1);
    expect(results[1]?.id).toBe("guide:refsubject-model");
    expect(results.findIndex(({ title }) => title === "map")).toBeGreaterThan(1);
  });

  it("finds misspelled concepts and keeps exact import destinations addressable", () => {
    const artifact = buildSearchArtifact(model, inventory);
    expect(searchDocumentation(artifact, "RefSubjct")[0]?.id).toBe("module:@typed/fx/RefSubject");
    expect(searchDocumentation(artifact, "@typed/fx#State")[0]?.id).toBe("@typed/fx#State");
    expect(searchDocumentation(artifact, "@typed/fx/RefSubject")[0]?.id).toBe(
      "module:@typed/fx/RefSubject",
    );
    expect(searchDocumentation(artifact, "RefSubject map")[0]?.id).toBe("@typed/fx/RefSubject#map");
  });

  it("deduplicates declaration aliases but preserves unrelated same-named APIs", () => {
    const entries: SearchEntry[] = [
      {
        id: "@typed/fx/Fx#map",
        canonicalId: "@typed/fx/Fx#map",
        declarationKey: "fx-map",
        title: "map",
        kind: "exposure",
        text: "map Fx values",
        specifier: "@typed/fx/Fx",
        href: "/fx-map",
      },
      {
        id: "@typed/fx#Fx.map",
        canonicalId: "@typed/fx/Fx#map",
        declarationKey: "fx-map",
        title: "Fx.map",
        kind: "exposure",
        text: "map Fx values",
        specifier: "@typed/fx",
        href: "/fx-alias",
      },
      {
        id: "@typed/fx/RefSubject#map",
        canonicalId: "@typed/fx/RefSubject#map",
        declarationKey: "state-map",
        title: "map",
        kind: "exposure",
        text: "map state",
        specifier: "@typed/fx/RefSubject",
        href: "/state-map",
      },
    ];
    expect(searchDocumentation(entries, "map").map(({ href }) => href)).toEqual([
      "/fx-map",
      "/state-map",
    ]);
    expect(searchDocumentation(entries, "@typed/fx#Fx.map")[0]?.href).toBe("/fx-alias");
  });

  it("keeps an ambiguous glossary name separate from identically named modules", () => {
    const artifact = buildSearchArtifact(model, {
      ...inventory,
      modules: [
        ...inventory.modules,
        {
          ...inventory.modules[0]!,
          consumerSpecifier: "@other/state/RefSubject",
          packageName: "@other/state",
        },
      ],
    });
    expect(
      artifact.entries.find(({ id }) => id === "glossary:refsubject")?.topicId,
    ).toBeUndefined();
    expect(
      searchDocumentation(artifact, "RefSubject").filter(({ kind }) => kind === "module"),
    ).toHaveLength(2);
  });

  it("does not treat a short API name as a good match for an unrelated long word", () => {
    const results = searchDocumentation(
      [{ id: "ref", title: "ref", kind: "exposure", text: "DOM element reference", href: "/ref" }],
      "RefSubjct",
    );
    expect(results).toEqual([]);
  });
});
