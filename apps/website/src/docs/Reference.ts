import type {
  DeclarationFamily,
  PublicApiExtraction,
  PublishedPackage,
  PublicModuleTarget,
  ReferenceInventory,
  ReferenceRoute,
  SymbolDocumentation,
} from "./Model.js";
import { editorialSymbolRelations } from "./Selection.js";

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

type ExportIdentity =
  | { readonly recordKind: "declaration"; readonly id: string; readonly declarationKey: string }
  | { readonly recordKind: "resource"; readonly id: string };

export const countUniqueExports = (exposures: ReadonlyArray<ExportIdentity>): number =>
  new Set(
    exposures.map((exposure) =>
      exposure.recordKind === "declaration"
        ? `declaration:${exposure.declarationKey}`
        : `resource:${exposure.id}`,
    ),
  ).size;

export const referenceSlug = (value: string): string =>
  [...new TextEncoder().encode(value)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

export const referenceRouteSlug = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/gu, "");
};

export const referenceIdFromRouteSlug = (slug: string): string | undefined => {
  if (!/^[A-Za-z0-9_-]+$/u.test(slug)) return undefined;
  try {
    const padded = `${slug.replace(/-/gu, "+").replace(/_/gu, "/")}${"=".repeat(
      (4 - (slug.length % 4)) % 4,
    )}`;
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return referenceRouteSlug(value) === slug ? value : undefined;
  } catch {
    return undefined;
  }
};

export const referencePath = (id: string): string => `/reference/symbols/${referenceRouteSlug(id)}`;

/** Resolve readable public API links in authored Markdown to the static symbol route. */
export const canonicalReferencePath = (path: string): string =>
  path
    .replace(
      /^\/reference\/(modules|packages)\/([^?#]+)/u,
      (_match, kind: string, specifier: string) =>
        `/reference/${kind}/${encodeURI(decodeURIComponent(specifier))}`,
    )
    .replace(/^\/reference\/(%40typed%2F[^/?#]+)/iu, (_match, id: string) =>
      referencePath(decodeURIComponent(id)),
    );

const route = (kind: ReferenceRoute["kind"], id: string, canonicalPath: string): ReferenceRoute => {
  const collection = kind === "exposure" ? "exposures" : `${kind}s`;
  const direct = `/docs/reference/${collection}/${referenceSlug(id)}`;
  return { kind, id, canonicalPath, markdownPath: `${direct}.md`, jsonPath: `${direct}.json` };
};

const moduleGroupSpecifier = (packageName: string, consumerSpecifier: string): string => {
  if (consumerSpecifier === packageName) return packageName;
  const subpath = consumerSpecifier.slice(packageName.length + 1);
  return `${packageName}/${subpath.slice(0, subpath.indexOf("/") < 0 ? undefined : subpath.indexOf("/"))}`;
};

/** Builds the navigable reference hierarchy without applying editorial selections. */
export const buildReferenceInventory = (
  publishedPackages: ReadonlyArray<PublishedPackage>,
  targets: ReadonlyArray<PublicModuleTarget>,
  extraction: PublicApiExtraction,
): ReferenceInventory => {
  const declarations = new Map(
    extraction.declarations.map((declaration) => [declaration.declarationKey, declaration]),
  );
  const exposuresByModule = Map.groupBy(
    extraction.exposures,
    ({ consumerSpecifier }) => consumerSpecifier,
  );
  const modules = targets.map((target) => {
    const exposures = exposuresByModule.get(target.consumerSpecifier) ?? [];
    const categories = Map.groupBy(exposures, (exposure) => {
      if (exposure.recordKind === "resource") return "resource";
      return declarations.get(exposure.declarationKey)?.category ?? exposure.family;
    });
    return {
      packageName: target.packageName,
      packageVersion: target.packageVersion,
      consumerSpecifier: target.consumerSpecifier,
      exportSubpath: target.exportSubpath,
      mediaType: target.mediaType,
      categories: [...categories]
        .map(([name, members]) => ({
          name,
          exposureIds: members.map(({ id }) => id).sort(compareText),
        }))
        .sort((left, right) => compareText(left.name, right.name)),
      exposureIds: exposures.map(({ id }) => id).sort(compareText),
      uniqueExportCount: countUniqueExports(exposures),
    };
  });
  const packages = publishedPackages.map((published) => {
    const packageModules = modules.filter(({ packageName }) => packageName === published.name);
    const packageExposures = extraction.exposures.filter(
      ({ packageName }) => packageName === published.name,
    );
    const groupedModules = Map.groupBy(packageModules, ({ consumerSpecifier }) =>
      moduleGroupSpecifier(published.name, consumerSpecifier),
    );
    const groupOrder = [...groupedModules.keys()];
    return {
      packageName: published.name,
      packageVersion: published.version,
      moduleSpecifiers: packageModules.map(({ consumerSpecifier }) => consumerSpecifier),
      moduleGroups: groupOrder.flatMap((id) => {
        const members = groupedModules.get(id);
        if (members === undefined) return [];
        return [
          {
            id,
            title: id,
            modules: members.map(({ consumerSpecifier, exposureIds }) => ({
              consumerSpecifier,
              exposureIds,
            })),
          },
        ];
      }),
      exposureIds: packageModules.flatMap(({ exposureIds }) => exposureIds).sort(compareText),
      uniqueExportCount: countUniqueExports(packageExposures),
    };
  });
  const routes: ReadonlyArray<ReferenceRoute> = [
    ...packages.map(({ packageName }) =>
      route("package", `package:${packageName}`, `/reference/packages/${encodeURI(packageName)}`),
    ),
    ...modules.map(({ consumerSpecifier }) =>
      route(
        "module",
        `module:${consumerSpecifier}`,
        `/reference/modules/${encodeURI(consumerSpecifier)}`,
      ),
    ),
    ...extraction.exposures.map(({ id }) => route("exposure", id, referencePath(id))),
  ];

  return {
    uniqueExportCount: countUniqueExports(extraction.exposures),
    packages,
    modules,
    declarations: extraction.declarations,
    exposures: extraction.exposures,
    resources: extraction.resources,
    routes,
  };
};

const symbolKind = (family: DeclarationFamily): SymbolDocumentation["kind"] => {
  switch (family) {
    case "class":
      return "class";
    case "function":
    case "method":
    case "constructor":
    case "call-signature":
    case "construct-signature":
      return "function";
    case "interface":
      return "interface";
    case "type-alias":
    case "enum":
    case "namespace":
      return "type";
    default:
      return "constant";
  }
};

const selectedGlossary = new Map<string, string>(
  editorialSymbolRelations.map(({ id, glossary }) => [id, glossary]),
);

/** Projects every consumer-facing exposure into the existing page/API document contract. */
export const projectSymbols = (
  inventory: ReferenceInventory,
): ReadonlyArray<SymbolDocumentation> => {
  const declarations = new Map(
    inventory.declarations.map((declaration) => [declaration.declarationKey, declaration]),
  );
  return inventory.exposures.map((exposure): SymbolDocumentation => {
    if (exposure.recordKind === "resource") {
      return {
        id: exposure.id,
        packageName: exposure.packageName,
        moduleName: exposure.moduleName,
        exportName: exposure.qualifiedName,
        kind: "resource",
        signatures: [`export ${exposure.consumerSpecifier} as ${exposure.mediaType}`],
        summary: `Published ${exposure.mediaType} resource from ${exposure.consumerSpecifier}.`,
        sections: {
          Why: exposure.usage,
          "Ownership and lifetime":
            "This immutable package resource acquires no runtime services or browser resources.",
        },
        examples: [],
        relations: [],
        source: {
          file: exposure.sourceSpans[0]?.file ?? "package.json",
          line: exposure.sourceSpans[0]?.start.line ?? 1,
        },
        category: "resource",
      };
    }
    const declaration = declarations.get(exposure.declarationKey);
    if (declaration === undefined) {
      throw new Error(`${exposure.id} references missing declaration ${exposure.declarationKey}`);
    }
    const glossary = selectedGlossary.get(exposure.id);
    return {
      id: exposure.id,
      packageName: exposure.packageName,
      moduleName: exposure.moduleName,
      exportName: exposure.qualifiedName,
      kind: symbolKind(exposure.family),
      signatures: exposure.signatures,
      summary:
        declaration.summary ||
        `Public ${exposure.family} exposed as ${exposure.qualifiedName} from ${exposure.consumerSpecifier}.`,
      sections: declaration.sections,
      examples: declaration.examples,
      relations: glossary === undefined ? [] : [{ kind: "glossary", target: glossary }],
      source: {
        file: exposure.sourceSpans[0]?.file ?? "package.json",
        line: exposure.sourceSpans[0]?.start.line ?? 1,
      },
      ...(declaration.since === undefined ? {} : { since: declaration.since }),
      category: declaration.category ?? exposure.family,
    };
  });
};
