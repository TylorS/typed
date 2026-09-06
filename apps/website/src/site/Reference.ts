import { referenceInventory } from "../generated/reference.js";
import type { ExposureRecord, SourceSpan } from "../docs/Model.js";
import { projectSymbols, referencePath } from "../docs/Reference.js";
import { siteHref } from "../SiteHref.js";

export const inventory = referenceInventory;
export const packages = new Map(inventory.packages.map((value) => [value.packageName, value]));
export const modules = new Map(inventory.modules.map((value) => [value.consumerSpecifier, value]));
export const exposures = new Map(inventory.exposures.map((value) => [value.id, value]));
export const declarations = new Map(
  inventory.declarations.map((value) => [value.declarationKey, value]),
);
export const symbols = new Map(projectSymbols(inventory).map((value) => [value.id, value]));
export const routes = new Map(inventory.routes.map((value) => [value.id, value]));
export const children = Map.groupBy(
  inventory.exposures.filter((value) => value.recordKind === "declaration" && value.parentId),
  (value) => (value.recordKind === "declaration" ? value.parentId! : ""),
);
export const aliases = Map.groupBy(inventory.exposures, (value) =>
  value.recordKind === "declaration" ? value.declarationKey : value.id,
);
export const packageHref = (name: string) => siteHref(`/reference/packages/${encodeURI(name)}`);
export const moduleHref = (name: string) => siteHref(`/reference/modules/${encodeURI(name)}`);
export const symbolHref = (id: string) => siteHref(referencePath(id));
export const categoryId = (name: string) =>
  `category-${name.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}`;
export const codeBlock = (code: string, language = "ts") => {
  const fence = "`".repeat(
    Math.max(3, ...[...code.matchAll(/`+/gu)].map(([run]) => run.length + 1)),
  );
  return `${fence}${language}\n${code.trim()}\n${fence}`;
};
export const exampleMarkdown = (language: string, code: string) =>
  /^(?:```|~~~)/u.test(code.trim()) ? code.trim() : codeBlock(code, language);
export const sourceHref = (span: SourceSpan) =>
  `https://github.com/TylorS/typed/blob/development/${span.file.split("/").map(encodeURIComponent).join("/")}#L${span.start.line}`;
export const publicImport = (exposure: ExposureRecord) => {
  if (exposure.recordKind === "resource") return exposure.usage;
  const name = exposure.exportName;
  const root = exposures.get(`${exposure.consumerSpecifier}#${name}`);
  const declaration = declarations.get(
    root?.recordKind === "declaration" ? root.declarationKey : exposure.declarationKey,
  );
  const typeOnly = declaration?.facets.every(
    (facet) => facet.family === "interface" || facet.family === "type-alias",
  );
  if (name === "default") {
    const authoredName = declaration?.name !== "default" ? declaration?.name : undefined;
    const signatureName = declaration?.signatures
      .join("\n")
      .match(/\b(?:function|class)\s+([A-Za-z_$][\w$]*)/u)?.[1];
    const moduleName = exposure.consumerSpecifier
      .split("/")
      .at(-1)!
      .replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
    const candidate = authoredName ?? signatureName;
    const localName =
      candidate && candidate !== "default" && !candidate.startsWith("_")
        ? candidate
        : `${moduleName}${moduleName === "client" || moduleName === "server" ? "Renderer" : "Default"}`;
    return `import ${typeOnly ? "type " : ""}${localName} from ${JSON.stringify(exposure.consumerSpecifier)};`;
  }
  return `import ${typeOnly ? "type " : ""}{ ${name} } from ${JSON.stringify(exposure.consumerSpecifier)};`;
};
export const descriptions: Readonly<Record<string, string>> = {
  "@typed/astro":
    "Render Typed templates in Astro, with server HTML, scoped hydration, and native client directives.",
  "@typed/async-data":
    "Represent loading, success, failure, refresh, and optimistic state with an explicit data model.",
  "@typed/fx":
    "Compose push-based effects, current state, event publications, and effectful consumers.",
  "@typed/guard":
    "Decode and refine values through composable guards with typed success and failure.",
  "@typed/id": "Create and validate identifiers with explicit formats and type-safe identity.",
  "@typed/navigation": "Model browser navigation and URL changes as Effect services.",
  "@typed/router": "Define typed routes, decode URL inputs, and select matching application views.",
  "@typed/template":
    "Describe renderer-independent templates and interpret them as cooperative DOM or ordered HTML.",
  "@typed/tsconfig":
    "Share TypeScript configuration for libraries, browser applications, and build tooling.",
  "@typed/ui":
    "Build accessible browser interactions and reusable UI from Typed state and templates.",
};
export { siteHref };
