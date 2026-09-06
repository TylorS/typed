import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import ts from "typescript-compiler";
import { validateCoverage } from "../Coverage.js";
import { extractPackage, extractPublicModules } from "../Extract.js";
import type { DeclarationExposureRecord, PublicModuleTarget } from "../Model.js";

const completePackage = fileURLToPath(new URL("./fixtures/complete-package", import.meta.url));
const temporaryRoots: Array<string> = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const write = (root: string, relativePath: string, contents: string): string => {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  return target;
};

const sourceMappings = (lineCount: number, firstSegment = "AAAA"): string =>
  Array.from({ length: lineCount }, (_, index) => (index === 0 ? firstSegment : "AACA")).join(";");

const writeDeclaration = (
  packageRoot: string,
  name: string,
  contents: string,
  sources: ReadonlyArray<string> = [`${name}.ts`],
  firstSegment = "AAAA",
): string => {
  const declaration = write(packageRoot, `dist/${name}.d.ts`, contents);
  write(
    packageRoot,
    `dist/${name}.d.ts.map`,
    JSON.stringify({
      version: 3,
      file: `${name}.d.ts`,
      sourceRoot: "../src",
      sources,
      names: [],
      mappings: sourceMappings(contents.split("\n").length, firstSegment),
    }),
  );
  for (const source of sources) {
    write(packageRoot, `src/${source}`, contents);
  }
  write(packageRoot, `dist/${name}.js`, "export {};\n");
  return declaration;
};

const moduleTarget = (
  packageRoot: string,
  consumerSpecifier: string,
  documentationTarget: string,
  mediaType: PublicModuleTarget["mediaType"] = "text/typescript",
): PublicModuleTarget => ({
  packageName: "@fixture/exposure",
  packageVersion: "1.2.3",
  packageRoot,
  consumerSpecifier,
  exportSubpath:
    consumerSpecifier === "@fixture/exposure"
      ? "."
      : `./${consumerSpecifier.slice("@fixture/exposure/".length)}`,
  documentationTarget,
  runtimeTarget:
    mediaType === "application/json"
      ? documentationTarget
      : documentationTarget.replace(/\.d\.ts$/u, ".js"),
  mediaType,
  activeConditions: mediaType === "application/json" ? [] : ["types", "import"],
});

const makeExtractionFixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "typed-extract-"));
  temporaryRoots.push(root);
  const packageRoot = path.join(root, "packages", "exposure");
  write(
    packageRoot,
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        baseUrl: ".",
        paths: { "#fixture/*": ["dist/*"] },
      },
      include: ["src"],
    }),
  );

  const facadeSource = `/** A facade member. */
export declare function run(value: string): string;

export declare namespace Nested {
  function execute(): void;
}

export declare namespace Cycle {
  const value: string;
  export import Again = Cycle;
}
`;
  const facade = writeDeclaration(
    packageRoot,
    "facade",
    facadeSource,
    ["unused.ts", "facade.ts"],
    "ACAA",
  );

  const indexSource = `/** A function with ordered overloads. */
export declare function original(value: string): string;
export declare function original(value: number): number;
export { original as alias };
export * as Facade from "#fixture/facade";

/** A callable object. */
export declare const callable: {
  (input: string): number;
  readonly label: string;
};

export declare const authoredCallable: <T>(
  value: T,
) => T extends string ? readonly [T] : never;
export declare const inferred = "value";

export declare function authoredFunction<T>(
  value: T,
): T extends string ? readonly [T] : never;

/** A merged function and namespace. */
export declare function merged(value: string): string;
export declare namespace merged {
  const version: string;
  namespace nested {
    function execute(): void;
  }
}

/** A public class. */
export declare abstract class Box<T> {
  /**
   * Constructs a documented box.
   * @remarks
   * ## Why
   * Makes constructor prose available on its own public member record.
   * ## Ownership and lifetime
   * The caller owns the returned box.
   * @example
   * \`\`\`ts
   * declare const BoxValue: typeof Box
   * \`\`\`
   * @category Models
   * @since 1.0.0
   */
  constructor(public readonly parameterValue: T);
  readonly value: T;
  static create<T>(value: T): Box<T>;
  get current(): T;
  set current(value: T);
  abstract method(value: T): T;
  private secret;
}

export declare class MergedClass {
  own(): void;
}
export interface MergedClass {
  readonly augmented: string;
}

/** A callable public interface. */
export interface Shape<T> {
  /** Calls the documented shape. @since 1.0.0 */
  (value: T): T;
  /** Constructs the documented shape. @since 1.0.0 */
  new (value: T): Shape<T>;
  readonly value: T;
  method(value: T): T;
  [key: string]: unknown;
}

/** A structural alias. */
export type Pair<T> = readonly [T, T];

/** A named record with recursively public fields. */
export type NamedOptions = {
  /** Enables the option. */
  readonly enabled: boolean;
  /** Groups nested options. */
  readonly nested: {
    /** Selects the retry count. */
    readonly retries: number;
  };
};

/** An inline record nested inside an intersection. */
export type IntersectedOptions = { readonly left: string } & {
  readonly right: {
    readonly value: number;
  };
};

/** A class with a nested callable static API. */
export declare class StaticApi {
  static readonly operation: {
    /** Calls the operation. */
    (value: string): number;
    /** Constructs the operation. */
    new (value: string): NamedOptions;
    /** Names the operation. */
    readonly label: string;
    /** Groups nested operation metadata. */
    readonly metadata: {
      /** The public operation version. */
      readonly version: string;
      /** A public nested member. */
      readonly hidden: string;
    };
  };
}

/** Public choices. */
export declare enum Color {
  Red = "red",
  Blue = "blue"
}

/** The default callable. */
export default function (value: string): string;
`;
  const index = writeDeclaration(packageRoot, "index", indexSource);
  write(
    packageRoot,
    "src/index.ts",
    indexSource.replaceAll(
      "T extends string ? readonly [T] : never",
      "T extends unknown ? readonly [T, T] : readonly never[]",
    ),
  );

  return {
    root,
    packageRoot,
    targets: [
      moduleTarget(packageRoot, "@fixture/exposure", index),
      moduleTarget(packageRoot, "@fixture/exposure/facade", facade),
    ],
  };
};

describe("extractPackage", () => {
  it("extracts the published surface with stable identities and authored details", () => {
    const documentation = extractPackage(completePackage);

    expect(documentation.packageName).toBe("@fixture/docs");
    expect(documentation.version).toBe("1.2.3");
    expect(documentation.modules.map((module) => module.name)).toEqual([".", "Complete"]);

    const combine = documentation.symbols.find(
      (symbol) => symbol.id === "@fixture/docs/Complete#combine",
    );
    expect(combine).toMatchObject({
      packageName: "@fixture/docs",
      moduleName: "Complete",
      exportName: "combine",
      kind: "function",
      summary: "Combines a value with a mapping function.",
      since: "1.2.0",
      category: "combinators",
    });
    expect(combine?.signatures).toHaveLength(2);
    expect(combine?.signatures[0]).toContain("combine<A, B>");
    expect(combine?.sections).toEqual({
      Why: "Keeps the value and transformation relationship visible in the type signature.",
      "Ownership and lifetime": "Performs no acquisition and retains no resources after returning.",
    });
    expect(combine?.examples).toEqual([
      expect.objectContaining({
        language: "ts",
        code: expect.stringContaining('import { Complete } from "@fixture/docs"'),
      }),
    ]);
    expect(combine?.source.file).toMatch(/complete\.ts$/);
    expect(combine?.source.line).toBeGreaterThan(0);
    expect(documentation.symbols.some((symbol) => symbol.exportName === "privateHelper")).toBe(
      false,
    );
  });
});

describe("public module extraction", () => {
  it("models every exposure family, alias, member, merge, and cycle once", () => {
    const fixture = makeExtractionFixture();
    const result = extractPublicModules(fixture.targets, { repositoryRoot: fixture.root });
    const byId = new Map(
      result.exposures
        .filter(
          (exposure): exposure is DeclarationExposureRecord =>
            exposure.recordKind === "declaration",
        )
        .map((exposure) => [exposure.id, exposure]),
    );
    const getDeclarationExposure = (id: string): DeclarationExposureRecord => {
      const exposure = byId.get(id);
      expect(exposure?.recordKind, id).toBe("declaration");
      if (exposure?.recordKind !== "declaration") throw new Error(`Missing declaration ${id}.`);
      return exposure;
    };

    expect(result.diagnostics).toEqual([]);
    expect(result.exposures.map((exposure) => exposure.id)).toEqual(
      result.expectedExposures.map((exposure) => exposure.id),
    );
    expect(new Set(result.exposures.map((exposure) => exposure.id)).size).toBe(
      result.exposures.length,
    );

    const original = getDeclarationExposure("@fixture/exposure#original");
    const alias = getDeclarationExposure("@fixture/exposure#alias");
    const facadeRun = getDeclarationExposure("@fixture/exposure#Facade.run");
    const directRun = getDeclarationExposure("@fixture/exposure/facade#run");
    expect(original).toMatchObject({ family: "function", signatures: expect.any(Array) });
    expect(original.signatures).toHaveLength(2);
    expect(alias).toMatchObject({
      family: "function",
      declarationKey: original.declarationKey,
      isAlias: true,
      importedFrom: original.declarationKey,
      aliases: expect.arrayContaining(["@fixture/exposure#original"]),
    });
    expect(facadeRun).toMatchObject({
      family: "function",
      declarationKey: directRun.declarationKey,
      aliases: expect.arrayContaining(["@fixture/exposure/facade#run"]),
    });

    expect(byId.get("@fixture/exposure#callable")).toMatchObject({ family: "variable" });
    const callableSignatures = getDeclarationExposure("@fixture/exposure#callable").signatures;
    expect(callableSignatures).toHaveLength(1);
    expect(callableSignatures[0]).toContain("export declare const callable");
    expect(callableSignatures[0]).toContain("(input: string): number;");
    expect(callableSignatures[0]).toContain("readonly label: string;");
    for (const id of [
      "@fixture/exposure#callable.[[call]]",
      "@fixture/exposure#callable.label",
      "@fixture/exposure#Box.prototype.parameterValue",
      "@fixture/exposure#MergedClass.prototype.augmented",
    ]) {
      expect(
        result.expectedExposures.map(({ id }) => id),
        id,
      ).not.toContain(id);
      expect(byId.has(id), id).toBe(false);
    }
    expect(byId.has("@fixture/exposure#MergedClass.augmented")).toBe(false);
    const omittedCallable = {
      ...result,
      exposures: result.exposures.filter(({ id }) => id !== "@fixture/exposure#callable"),
    };
    expect(validateCoverage(result.expectedExposures, omittedCallable)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-exposure",
          id: "@fixture/exposure#callable",
        }),
      ]),
    );
    expect(getDeclarationExposure("@fixture/exposure#authoredCallable").signatures[0]).toContain(
      "T extends string ? readonly",
    );
    expect(getDeclarationExposure("@fixture/exposure#authoredFunction").signatures[0]).toContain(
      "T extends string ? readonly",
    );
    expect(
      getDeclarationExposure("@fixture/exposure#authoredCallable").signatures[0],
    ).not.toContain("readonly [T, T]");
    expect(getDeclarationExposure("@fixture/exposure#Box").signatures).toEqual([
      `export declare abstract class Box<T> {
    constructor(public readonly parameterValue: T);
    readonly value: T;
    static create<T>(value: T): Box<T>;
    get current(): T;
    set current(value: T);
    abstract method(value: T): T;
}`,
    ]);
    expect(getDeclarationExposure("@fixture/exposure#Shape").signatures[0]).toBe(
      `export interface Shape<T> {
    (value: T): T;
    new (value: T): Shape<T>;
    readonly value: T;
    method(value: T): T;
    [key: string]: unknown;
}`,
    );
    expect(getDeclarationExposure("@fixture/exposure#Color").signatures).toEqual([
      `export declare enum Color {
    Red = "red",
    Blue = "blue"
}`,
    ]);
    expect(getDeclarationExposure("@fixture/exposure#NamedOptions").signatures[0]).toBe(
      `export type NamedOptions = {
    readonly enabled: boolean;
    readonly nested: {
        readonly retries: number;
    };
};`,
    );
    expect(getDeclarationExposure("@fixture/exposure#NamedOptions").signatures[0]).not.toContain(
      "/**",
    );
    expect(getDeclarationExposure("@fixture/exposure#default").signatures).toEqual([
      "export default function (value: string): string;",
    ]);
    expect(getDeclarationExposure("@fixture/exposure#inferred").signatures).toEqual([
      `export declare const inferred = "value";`,
    ]);
    expect(byId.get("@fixture/exposure#merged")).toMatchObject({ family: "function" });
    const mergedExposure = getDeclarationExposure("@fixture/exposure#merged");
    const mergedDeclaration = result.declarations.find(
      (declaration) => declaration.declarationKey === mergedExposure.declarationKey,
    );
    expect(mergedDeclaration).toBeDefined();
    if (mergedDeclaration === undefined) throw new Error("Missing merged declaration.");
    expect(mergedDeclaration.facets.map((facet: { family: string }) => facet.family)).toEqual([
      "function",
      "namespace",
    ]);
    expect(mergedExposure.signatures).toEqual([
      "export declare function merged(value: string): string;",
      `export declare namespace merged {
    const version: string;
    namespace nested {
        function execute(): void;
    }
}`,
    ]);
    expect(byId.has("@fixture/exposure#merged.nested.execute")).toBe(true);

    const foldedMemberIds = [
      "@fixture/exposure#NamedOptions.enabled",
      "@fixture/exposure#NamedOptions.nested",
      "@fixture/exposure#NamedOptions.nested.retries",
      "@fixture/exposure#IntersectedOptions.left",
      "@fixture/exposure#IntersectedOptions.right",
      "@fixture/exposure#IntersectedOptions.right.value",
      "@fixture/exposure#StaticApi.operation",
      "@fixture/exposure#StaticApi.operation.[[call]]",
      "@fixture/exposure#StaticApi.operation.[[construct]]",
      "@fixture/exposure#StaticApi.operation.label",
      "@fixture/exposure#StaticApi.operation.metadata",
      "@fixture/exposure#StaticApi.operation.metadata.hidden",
      "@fixture/exposure#StaticApi.operation.metadata.version",
    ];
    for (const id of foldedMemberIds) {
      expect(
        result.expectedExposures.map(({ id }) => id),
        id,
      ).not.toContain(id);
      expect(byId.has(id), id).toBe(false);
    }
    const staticApiSignatures = getDeclarationExposure("@fixture/exposure#StaticApi").signatures;
    expect(staticApiSignatures).toHaveLength(1);
    expect(staticApiSignatures[0]).toContain("(value: string): number;");
    expect(staticApiSignatures[0]).toContain("new (value: string): NamedOptions;");
    expect(staticApiSignatures[0]).toContain("readonly version: string;");
    expect(validateCoverage(result.expectedExposures, result)).toEqual([]);

    const boxExposure = getDeclarationExposure("@fixture/exposure#Box");
    expect(
      result.declarations.find(
        ({ declarationKey }) => declarationKey === boxExposure.declarationKey,
      ),
    ).toMatchObject({
      sections: {
        Why: "Makes constructor prose available on its own public member record.",
        "Ownership and lifetime": "The caller owns the returned box.",
      },
      examples: [expect.objectContaining({ language: "ts" })],
      category: "Models",
      since: "1.0.0",
    });

    const facadeDeclaration = result.declarations.find(
      ({ declarationKey }) =>
        declarationKey === getDeclarationExposure("@fixture/exposure#Facade").declarationKey,
    );
    expect(facadeDeclaration?.name).toBe("Facade");
    expect(getDeclarationExposure("@fixture/exposure#Facade").signatures).toEqual([
      'export * as Facade from "#fixture/facade";',
    ]);
    expect(facadeDeclaration?.signatures).toEqual(["namespace Facade"]);
    expect(facadeDeclaration?.signatures.join("\n")).not.toContain("export declare function run");
    expect(JSON.stringify(result)).not.toContain(fixture.root);

    for (const [id, family] of [
      ["@fixture/exposure#Box", "class"],
      ["@fixture/exposure#Shape", "interface"],
      ["@fixture/exposure#Pair", "type-alias"],
      ["@fixture/exposure#Color", "enum"],
      ["@fixture/exposure#default", "function"],
      ["@fixture/exposure#Facade", "namespace"],
      ["@fixture/exposure#Facade.Nested", "namespace"],
    ] as const) {
      expect(byId.get(id), id).toMatchObject({ family });
    }
    expect(byId.has("@fixture/exposure#Box.prototype.secret")).toBe(false);
    expect(byId.has("@fixture/exposure#Facade.Cycle.Again")).toBe(true);
    expect(result.exposures.some((exposure) => exposure.id.includes("Again.Again"))).toBe(false);

    for (const declaration of result.declarations) {
      expect(declaration.sourceSpans.length).toBeGreaterThan(0);
      for (const span of declaration.sourceSpans) {
        expect(path.isAbsolute(span.file)).toBe(false);
        expect(span.file).not.toContain("..");
        expect(span.start.line).toBeGreaterThan(0);
        expect(span.end.line).toBeGreaterThanOrEqual(span.start.line);
      }
    }
    expect(facadeRun.sourceSpans[0].file).toBe("packages/exposure/src/facade.ts");
  });

  it.each([
    ["named-default", "export default function typed(): string;", "function typed"],
    ["anonymous-default", "export default function (): string;", "export default function"],
    [
      "default-object",
      "declare const renderer: { render(input: string): string };\nexport default renderer;",
      "const renderer",
    ],
  ])("preserves parseable default-export declarations for %s", (name, source, expected) => {
    const fixture = makeExtractionFixture();
    const target = writeDeclaration(fixture.packageRoot, name, source);
    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, `@fixture/exposure/${name}`, target)],
      { repositoryRoot: fixture.root },
    );
    expect(result.diagnostics).toEqual([]);
    const exposure = result.exposures.find(({ id }) => id === `@fixture/exposure/${name}#default`);
    expect(exposure).toMatchObject({
      recordKind: "declaration",
      exportName: "default",
      qualifiedName: "default",
    });
    if (exposure?.recordKind !== "declaration") throw new Error("Missing default exposure");
    expect(exposure.signatures.join("\n")).toContain(expected);
    expect(exposure.signatures.join("\n")).toContain("export default");
    const declaration = result.declarations.find(
      ({ declarationKey }) => declarationKey === exposure.declarationKey,
    )!;
    for (const signature of [...exposure.signatures, ...declaration.signatures]) {
      const parsed = ts.createSourceFile(
        "default.d.ts", signature, ts.ScriptTarget.Latest, true,
      ) as ts.SourceFile & { readonly parseDiagnostics: ReadonlyArray<ts.Diagnostic> };
      expect(parsed.parseDiagnostics.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      )).toEqual([]);
    }
    expect(validateCoverage(result.expectedExposures, result)).toEqual([]);
  });

  it("omits non-public declarations and facets while retaining public merge and overload facets", () => {
    const fixture = makeExtractionFixture();
    const invalidSource = `/** @internal */
export declare const hidden: string;
export type NestedInternal = {
  /** @internal */
  readonly hidden: string;
  readonly _visible: string;
};
export declare function overloaded(value: string): string;
/** @internal */
export declare function overloaded(value: number): number;
export interface Merged {
  readonly value: string;
}
/** @internal */
export declare namespace Merged {
  const hidden: string;
}
export declare class Members {
  private secret;
  protected inheritedSecret: string;
  #private;
  readonly _visible: string;
  /** @ignore */
  readonly ignored: string;
  method(value: string): string;
  /** @internal */
  method(value: number): number;
}
export declare const { unsupported }: { unsupported: string };
`;
    const invalid = writeDeclaration(fixture.packageRoot, "invalid", invalidSource);
    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/invalid", invalid)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unsupported-declaration",
          consumerSpecifier: "@fixture/exposure/invalid",
          qualifiedName: "unsupported",
        }),
      ]),
    );
    expect(result.diagnostics.some(({ code }) => code === "published-internal")).toBe(false);
    expect(result.expectedExposures.map((exposure) => exposure.id)).toEqual(
      [
        "@fixture/exposure/invalid#Members",
        "@fixture/exposure/invalid#Merged",
        "@fixture/exposure/invalid#NestedInternal",
        "@fixture/exposure/invalid#overloaded",
        "@fixture/exposure/invalid#unsupported",
      ].sort(),
    );
    expect(result.exposures.map(({ id }) => id)).toEqual(
      result.expectedExposures.map(({ id }) => id),
    );
    const byId = new Map(
      result.exposures
        .filter(
          (exposure): exposure is DeclarationExposureRecord =>
            exposure.recordKind === "declaration",
        )
        .map((exposure) => [exposure.id, exposure]),
    );
    expect(byId.get("@fixture/exposure/invalid#overloaded")?.signatures).toEqual([
      "export declare function overloaded(value: string): string;",
    ]);
    const memberSignatures = byId.get("@fixture/exposure/invalid#Members")?.signatures;
    expect(memberSignatures).toHaveLength(1);
    expect(memberSignatures?.[0]).toContain("readonly _visible: string;");
    expect(memberSignatures?.[0]).toContain("method(value: string): string;");
    expect(byId.get("@fixture/exposure/invalid#Members")?.signatures.join("\n")).not.toMatch(
      /secret|inheritedSecret|#private|ignored|value: number/u,
    );
    expect(byId.get("@fixture/exposure/invalid#NestedInternal")?.signatures).toHaveLength(1);
    expect(byId.get("@fixture/exposure/invalid#NestedInternal")?.signatures[0]).toContain(
      "readonly _visible: string;",
    );
    expect(
      byId.get("@fixture/exposure/invalid#NestedInternal")?.signatures.join("\n"),
    ).not.toContain("readonly hidden: string;");
    const merged = byId.get("@fixture/exposure/invalid#Merged");
    expect(
      result.declarations
        .find(({ declarationKey }) => declarationKey === merged?.declarationKey)
        ?.facets.map(({ family }) => family),
    ).toEqual(["interface", "property"]);
  });

  it("normalizes an export assignment to the consumer-facing default exposure", () => {
    const fixture = makeExtractionFixture();
    const assignment = writeDeclaration(
      fixture.packageRoot,
      "assignment",
      `declare const assigned: { readonly value: string };
export = assigned;
`,
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/assignment", assignment)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.expectedExposures.map(({ id }) => id)).toEqual([
      "@fixture/exposure/assignment#default",
    ]);
    expect(result.exposures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "@fixture/exposure/assignment#default",
          qualifiedName: "default",
          family: "variable",
          signatures: [expect.stringContaining("const assigned")],
        }),
      ]),
    );
    expect(result.exposures[0]?.recordKind).toBe("declaration");
    if (result.exposures[0]?.recordKind === "declaration") {
      expect(result.exposures[0].signatures[0]).toContain("readonly value: string;");
    }
    expect(result.declarations).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "assigned", family: "variable" })]),
    );
    const assignedDeclaration = result.declarations.find(({ name }) => name === "assigned");
    expect(result.exposures[0]).toMatchObject({
      importedFrom: assignedDeclaration?.declarationKey,
    });
  });

  it("does not turn imported signature dependencies into public exposures", () => {
    const fixture = makeExtractionFixture();
    writeDeclaration(
      fixture.packageRoot,
      "dependency",
      "export interface SignatureDependency { readonly value: string; }\n",
    );
    const entrypoint = writeDeclaration(
      fixture.packageRoot,
      "dependency-entrypoint",
      `import type { SignatureDependency } from "#fixture/dependency";
export declare function readDependency(): SignatureDependency;
`,
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/dependency", entrypoint)],
      { repositoryRoot: fixture.root },
    );

    expect(result.exposures.map(({ id }) => id)).toEqual([
      "@fixture/exposure/dependency#readDependency",
    ]);
    expect(result.declarations.map(({ name }) => name)).toEqual(["readDependency"]);
  });

  it("omits documentation-hidden re-export edges without hiding a public alias", () => {
    const fixture = makeExtractionFixture();
    writeDeclaration(
      fixture.packageRoot,
      "aliased-dependency",
      "export interface AliasedDependency { readonly value: string; }\n",
    );
    const entrypoint = writeDeclaration(
      fixture.packageRoot,
      "aliased-entrypoint",
      `/** @internal */
export { AliasedDependency as HiddenAlias } from "#fixture/aliased-dependency";
export { AliasedDependency as VisibleAlias } from "#fixture/aliased-dependency";
`,
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/aliases", entrypoint)],
      { repositoryRoot: fixture.root },
    );

    expect(result.exposures.map(({ id }) => id)).toEqual([
      "@fixture/exposure/aliases#VisibleAlias",
    ]);
    expect(result.exposures[0]).toMatchObject({
      signatures: [expect.stringContaining("readonly value: string;")],
    });
  });

  it("folds structural members, overloads, and documentation into the exported owner", () => {
    const fixture = makeExtractionFixture();
    const entrypoint = writeDeclaration(
      fixture.packageRoot,
      "folded-members",
      `/**
 * Owns the complete callable API.
 * @example
 * \`\`\`ts
 * declare const api: CallableApi
 * \`\`\`
 */
export interface CallableApi {
  /**
   * Calls with text.
   * @example
   * \`\`\`ts
   * api("value")
   * \`\`\`
   */
  (value: string): number;
  (value: number): number;
  new (value: string): CallableApi;
  readonly value: string;
  method(value: string): void;
  get current(): string;
  set current(value: string);
  readonly nested: {
    readonly child: boolean;
  };
}
`,
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/folded-members", entrypoint)],
      { repositoryRoot: fixture.root },
    );

    expect(result.expectedExposures.map(({ id }) => id)).toEqual([
      "@fixture/exposure/folded-members#CallableApi",
    ]);
    expect(result.exposures.map(({ id }) => id)).toEqual([
      "@fixture/exposure/folded-members#CallableApi",
    ]);
    const exposure = result.exposures[0];
    expect(exposure?.recordKind).toBe("declaration");
    if (exposure?.recordKind !== "declaration") throw new Error("Missing CallableApi exposure.");
    expect(exposure.signatures).toHaveLength(1);
    expect(exposure.signatures[0]).toContain("export interface CallableApi");
    expect(exposure.signatures[0]).toContain("(value: string): number;");
    expect(exposure.signatures[0]).toContain("readonly child: boolean;");
    const declaration = result.declarations.find(
      ({ declarationKey }) => declarationKey === exposure.declarationKey,
    );
    expect(declaration?.facets.map(({ family }) => family)).toEqual(
      expect.arrayContaining([
        "interface",
        "call-signature",
        "construct-signature",
        "property",
        "method",
        "accessor",
      ]),
    );
    expect(declaration?.summary).toBe("Owns the complete callable API.");
    expect(declaration?.sections).toMatchObject({
      "Call signatures": "Calls with text.",
    });
    expect(declaration?.examples.map(({ code }) => code)).toEqual([
      "declare const api: CallableApi",
      'api("value")',
    ]);
  });

  it("maps published declaration spans to exclusive authored-source endpoints", () => {
    const fixture = makeExtractionFixture();
    const exact = writeDeclaration(
      fixture.packageRoot,
      "exact",
      "export declare function exact(value: string): number;\n",
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/exact", exact)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.declarations).toEqual([
      expect.objectContaining({
        sourceSpans: [
          {
            file: "packages/exposure/src/exact.ts",
            start: { line: 1, column: 1 },
            end: { line: 1, column: 54 },
          },
        ],
      }),
    ]);
  });

  it("uses the exact authored AST span instead of an in-bounds generated-column delta", () => {
    const fixture = makeExtractionFixture();
    const longer = writeDeclaration(
      fixture.packageRoot,
      "longer",
      "export declare const longer: string;\n",
    );
    write(fixture.packageRoot, "src/longer.ts", 'export const longer = "a much longer value";\n');

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/longer", longer)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.declarations).toEqual([
      expect.objectContaining({
        sourceSpans: [
          {
            file: "packages/exposure/src/longer.ts",
            start: { line: 1, column: 14 },
            end: { line: 1, column: 44 },
          },
        ],
      }),
    ]);
  });

  it("uses the named owner chain to distinguish same-named authored members", () => {
    const fixture = makeExtractionFixture();
    const owned = writeDeclaration(
      fixture.packageRoot,
      "owned",
      `export declare class First {
  readonly value: string;
}
export declare class Second {
  readonly value: string;
}
`,
    );
    write(
      fixture.packageRoot,
      "src/owned.ts",
      'export class First { readonly value = "first" } export class Second { readonly value = "second" }\n',
    );
    write(
      fixture.packageRoot,
      "dist/owned.d.ts.map",
      JSON.stringify({
        version: 3,
        file: "owned.d.ts",
        sourceRoot: "../src",
        sources: ["owned.ts"],
        names: [],
        mappings: Array.from({ length: 7 }, () => "AAAA").join(";"),
      }),
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/owned", owned)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(
      result.declarations
        .filter(({ name }) => name === "First" || name === "Second")
        .flatMap(({ facets }) =>
          facets
            .filter(({ family }) => family === "property")
            .map(({ sourceSpans }) => sourceSpans[0]),
        )
        .sort((left, right) => left!.start.column - right!.start.column),
    ).toEqual([
      {
        file: "packages/exposure/src/owned.ts",
        start: { line: 1, column: 22 },
        end: { line: 1, column: 46 },
      },
      {
        file: "packages/exposure/src/owned.ts",
        start: { line: 1, column: 71 },
        end: { line: 1, column: 96 },
      },
    ]);
  });

  it("diagnoses and falls back when an authored AST match is ambiguous", () => {
    const fixture = makeExtractionFixture();
    const ambiguous = writeDeclaration(
      fixture.packageRoot,
      "ambiguous",
      `export declare function repeated(value: string): string;
export declare function repeated(value: number): number;
`,
    );
    write(
      fixture.packageRoot,
      "src/ambiguous.ts",
      "export function repeated(value: string): string; export function repeated(value: number): number; export function repeated(value: string | number) { return value }\n",
    );
    write(
      fixture.packageRoot,
      "dist/ambiguous.d.ts.map",
      JSON.stringify({
        version: 3,
        file: "ambiguous.d.ts",
        sourceRoot: "../src",
        sources: ["ambiguous.ts"],
        names: [],
        mappings: "AAAA;AAAA;AAAA",
      }),
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/ambiguous", ambiguous)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([
      {
        code: "missing-source-map-mapping",
        packageName: "@fixture/exposure",
        consumerSpecifier: "@fixture/exposure/ambiguous",
        qualifiedName: "repeated",
        declarationFamily: "function",
        message:
          "The declaration-map start does not identify one authored declaration; provenance fell back to the published declaration span.",
      },
    ]);
    expect(result.declarations[0]?.sourceSpans.map(({ file }) => file)).toEqual([
      "packages/exposure/dist/ambiguous.d.ts",
      "packages/exposure/dist/ambiguous.d.ts",
    ]);
  });

  it("uses the exact authored AST span when authored text is shorter than the declaration", () => {
    const fixture = makeExtractionFixture();
    const shortMapped = writeDeclaration(
      fixture.packageRoot,
      "short-mapped",
      "export declare const shortMapped: string;\n",
    );
    write(fixture.packageRoot, "src/short-mapped.ts", 'export const shortMapped = "";\n');

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/short-mapped", shortMapped)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.declarations).toEqual([
      expect.objectContaining({
        sourceSpans: [
          {
            file: "packages/exposure/src/short-mapped.ts",
            start: { line: 1, column: 14 },
            end: { line: 1, column: 30 },
          },
        ],
      }),
    ]);
  });

  it("diagnoses a declaration that has no source-map segment", () => {
    const fixture = makeExtractionFixture();
    const unmapped = writeDeclaration(
      fixture.packageRoot,
      "unmapped",
      "export declare const unmapped: string;\n",
    );
    write(
      fixture.packageRoot,
      "dist/unmapped.d.ts.map",
      JSON.stringify({
        version: 3,
        file: "unmapped.d.ts",
        sourceRoot: "../src",
        sources: ["unmapped.ts"],
        names: [],
        mappings: "",
      }),
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/unmapped", unmapped)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-source-map-mapping",
          consumerSpecifier: "@fixture/exposure/unmapped",
          qualifiedName: "unmapped",
        }),
      ]),
    );
  });

  it("sanitizes an invalid declaration-map diagnostic", () => {
    const fixture = makeExtractionFixture();
    const invalidMap = writeDeclaration(
      fixture.packageRoot,
      "invalid-map",
      "export declare const invalidMap: string;\n",
    );
    write(
      fixture.packageRoot,
      "dist/invalid-map.d.ts.map",
      JSON.stringify({
        version: 3,
        file: "invalid-map.d.ts",
        sourceRoot: "../src",
        sources: ["invalid-map.ts"],
        names: [],
        mappings: "!",
      }),
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/invalid-map", invalidMap)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-declaration-map",
          consumerSpecifier: "@fixture/exposure/invalid-map",
          message: "Invalid declaration map for invalid-map.d.ts.",
        }),
      ]),
    );
    expect(JSON.stringify(result.diagnostics)).not.toContain(fixture.root);
  });

  it("diagnoses an authored mapping outside the repository", () => {
    const fixture = makeExtractionFixture();
    const outsideMap = writeDeclaration(
      fixture.packageRoot,
      "outside-map",
      "export declare const outsideMap: string;\n",
    );
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "typed-map-outside-"));
    temporaryRoots.push(outsideRoot);
    const outsideSource = write(outsideRoot, "outside-map.ts", "export const outsideMap = '';\n");
    write(
      fixture.packageRoot,
      "dist/outside-map.d.ts.map",
      JSON.stringify({
        version: 3,
        file: "outside-map.d.ts",
        sources: [outsideSource],
        names: [],
        mappings: "AAAA",
      }),
    );

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/outside-map", outsideMap)],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "source-outside-repository",
          consumerSpecifier: "@fixture/exposure/outside-map",
          qualifiedName: "outsideMap",
        }),
      ]),
    );
    expect(result.exposures[0]?.sourceSpans[0]?.file).toBe(
      "packages/exposure/dist/outside-map.d.ts",
    );
  });

  it("sanitizes missing extended tsconfig diagnostics to repository-relative paths", () => {
    const fixture = makeExtractionFixture();
    write(
      fixture.packageRoot,
      "tsconfig.json",
      JSON.stringify({
        extends: "./configs/missing.json",
        compilerOptions: {
          strict: true,
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          baseUrl: ".",
          paths: { "#fixture/*": ["dist/*"] },
        },
      }),
    );

    const result = extractPublicModules([fixture.targets[0]!], {
      repositoryRoot: fixture.root,
    });

    expect(result.diagnostics).toEqual([
      {
        code: "invalid-tsconfig",
        packageName: "@fixture/exposure",
        consumerSpecifier: "@fixture/exposure",
        message: "Cannot read file 'packages/exposure/configs/missing.json'.",
      },
    ]);
    expect(JSON.stringify(result.diagnostics)).not.toContain(fixture.root);
  });

  it("extracts exported JSON configurations as complete resource exposures", () => {
    const fixture = makeExtractionFixture();
    const raw = `{
  "extends": "./shared.json",
  "compilerOptions": {
    "strict": true,
    "lib": ["ES2024"]
  }
}
`;
    const resourceFile = write(fixture.packageRoot, "base.json", raw);
    const result = extractPublicModules(
      [
        moduleTarget(
          fixture.packageRoot,
          "@fixture/exposure/base",
          resourceFile,
          "application/json",
        ),
      ],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.declarations).toEqual([]);
    expect(result.resources).toEqual([
      expect.objectContaining({
        id: "@fixture/exposure/base#$resource",
        recordKind: "resource",
        family: "resource",
        consumerSpecifier: "@fixture/exposure/base",
        qualifiedName: "$resource",
        packageVersion: "1.2.3",
        mediaType: "application/json",
        raw,
        structured: {
          extends: "./shared.json",
          compilerOptions: { strict: true, lib: ["ES2024"] },
        },
        extends: ["./shared.json"],
        compilerOptions: { strict: true, lib: ["ES2024"] },
        usage: expect.stringContaining('"extends": "@fixture/exposure/base"'),
        sourceSpans: [expect.objectContaining({ file: "packages/exposure/base.json" })],
      }),
    ]);
    expect(result.exposures).toEqual(result.resources);
    expect(result.expectedExposures).toEqual([
      expect.objectContaining({ id: "@fixture/exposure/base#$resource" }),
    ]);
  });

  it("sanitizes a missing resource diagnostic", () => {
    const fixture = makeExtractionFixture();
    const missing = path.join(fixture.packageRoot, "missing.json");

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/missing", missing, "application/json")],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-resource",
          consumerSpecifier: "@fixture/exposure/missing",
          qualifiedName: "$resource",
          message: "Unable to read or parse the published JSON resource.",
        }),
      ]),
    );
    expect(JSON.stringify(result.diagnostics)).not.toContain(fixture.root);
  });

  it("diagnoses resource provenance outside the repository", () => {
    const fixture = makeExtractionFixture();
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "typed-resource-outside-"));
    temporaryRoots.push(outsideRoot);
    const outside = write(outsideRoot, "outside.json", "{}\n");

    const result = extractPublicModules(
      [moduleTarget(fixture.packageRoot, "@fixture/exposure/outside", outside, "application/json")],
      { repositoryRoot: fixture.root },
    );

    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "source-outside-repository",
          consumerSpecifier: "@fixture/exposure/outside",
          qualifiedName: "$resource",
        }),
      ]),
    );
    expect(result.resources[0]?.sourceSpans[0]?.file).toBe("outside.json");
  });

  it("is deterministic for identical published targets", () => {
    const fixture = makeExtractionFixture();

    const first = extractPublicModules(fixture.targets, { repositoryRoot: fixture.root });
    const second = extractPublicModules(fixture.targets, { repositoryRoot: fixture.root });

    expect(second).toEqual(first);
  });
});
