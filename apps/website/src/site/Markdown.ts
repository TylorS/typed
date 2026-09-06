import { unified } from "@astrojs/markdown-remark";
import type { AstroUserConfig } from "astro";
import { renderFxMarble } from "../docs/FxMarble.js";
import { canonicalReferencePath, referencePath } from "../docs/Reference.js";
import { referenceInventory } from "../generated/reference.js";
import { siteHref } from "../SiteHref.js";
import { remarkCurriculumSources } from "../tutorial/Files.js";

interface Node {
  type: string;
  value?: string;
  lang?: string | null;
  url?: string;
  children?: Node[];
}

const namespaces: Readonly<Record<string, string>> = {
  Fx: "@typed/fx/Fx",
  RefSubject: "@typed/fx/RefSubject",
  Subject: "@typed/fx/Subject",
  Sink: "@typed/fx/Sink",
  Route: "@typed/router/Route",
  Router: "@typed/router/Router",
};
const modules = new Set(
  referenceInventory.modules.map(({ consumerSpecifier }) => consumerSpecifier),
);
const exposures = new Set(referenceInventory.exposures.map(({ id }) => id));

/** Keep authored links deployment-independent and operator diagrams accessible. */
function typedMarkdown() {
  return (tree: Node) => {
    const base = (process.env.SITE_BASE ?? "/typed/").replace(/\/$/u, "");
    const visit = (node: Node): void => {
      if (node.type === "code" && node.lang === "fx-marble") {
        const diagram = renderFxMarble(node.value ?? "");
        if (diagram === undefined) throw new Error("Invalid Fx marble diagram");
        node.type = "html";
        node.value = diagram;
      }
      if (node.type === "inlineCode" && node.value) {
        const [namespace, ...members] = node.value.split(".");
        const specifier = namespaces[namespace!];
        const id = specifier && `${specifier}#${members.join(".")}`;
        const url = modules.has(node.value)
          ? `/reference/modules/${encodeURI(node.value)}`
          : id && members.length > 0 && exposures.has(id)
            ? referencePath(id)
            : undefined;
        // Module names and known qualified symbols have stable, source-derived routes.
        if (url) {
          node.type = "link";
          node.url = url;
          node.children = [{ type: "inlineCode", value: node.value }];
          delete node.value;
        }
      }
      if (
        (node.type === "link" || node.type === "image") &&
        node.url?.startsWith("/") &&
        !node.url.startsWith("//")
      ) {
        node.url = canonicalReferencePath(node.url);
        if (!base || (node.url !== base && !node.url.startsWith(`${base}/`)))
          node.url = siteHref(node.url, base);
      }
      // A generated inline-code link already contains its final leaf.
      if (node.type !== "link") node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export const markdown = {
  shikiConfig: { themes: { light: "github-light", dark: "github-dark" }, wrap: false },
  processor: unified({ remarkPlugins: [remarkCurriculumSources, typedMarkdown] }),
} satisfies NonNullable<AstroUserConfig["markdown"]>;

let processor: ReturnType<typeof markdown.processor.createRenderer> | undefined;
export const renderMarkdown = async (source: string) => {
  processor ??= markdown.processor.createRenderer(markdown);
  return (await processor).render(source);
};
