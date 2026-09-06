import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences, validateAuthoredExampleQuality } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideDirectory = path.join(websiteRoot, "content/guides");

// Preserve topic coverage and demonstrated contracts without freezing prose,
// chapter headings, article length, or the number of examples.
const groups = {
  "Template authoring": ["render-your-first-template", "authoring-typed-templates", "renderable-normalization", "keyed-template-collections"],
  "Template bindings": ["template-element-bindings", "template-spreads-data", "dom-class-names", "native-events-with-effect", "template-references-and-element-access", "template-namespaces-and-platform-markup", "template-text-only-contexts"],
  "Template rendering": ["mounting-dom-output", "rendering-html-on-the-server", "hydrating-typed-html", "server-rendering-and-hydration", "dom-updates-and-reconciliation", "dom-parts-and-attributes", "render-scheduling"],
  "Template internals": ["render-event-substrate", "dom-render-event", "html-render-event", "wire-and-rendered-dom-output", "template-compilation-pipeline", "implementing-render-template", "event-source-delegation"],
};
const demonstratedContracts: Record<string, ReadonlyArray<string>> = {
  "render-your-first-template": ["render(host)", "Fiber.interrupt", "RefSubject.make"],
  "authoring-typed-templates": [".value=${query}", "oninput=${readQuery}"],
  "renderable-normalization": ["Effect.succeed", "Stream.fromIterable", "Context.Service"],
  "keyed-template-collections": ["many(", "article.id", "RefSubject.map"],
  "template-element-bindings": ["title=${description}", ".value=${query}", "?disabled=${readOnly}"],
  "template-spreads-data": ["...${saveCapabilities}", ".data=${"],
  "dom-class-names": ["class=", "RefSubject.map"],
  "native-events-with-effect": ["EventHandler.make", "FormData", "preventDefault", "catchCause"],
  "template-references-and-element-access": ["Fx.callback", "RefSubject.set", "RefSubject.hydrate", "hydrateAll"],
  "template-namespaces-and-platform-markup": ["foreignObject", "xlink:href", "<math>"],
  "template-text-only-contexts": ["<textarea", "JSON.stringify", "<style>"],
  "mounting-dom-output": ["host.ownerDocument", "Fx.drain", "Fiber.interrupt"],
  "rendering-html-on-the-server": ["StaticHtmlRenderTemplate", "HtmlRenderTemplate", "renderToHtmlString", "Fx.toStream"],
  "hydrating-typed-html": ["render(host)", "DomRenderTemplate", "Effect.scoped"],
  "server-rendering-and-hydration": ["RefSubject.hydrate", "HtmlRenderTemplate", "DomRenderTemplate"],
  "dom-updates-and-reconciliation": ["many(", "RefSubject.map"],
  "dom-parts-and-attributes": ["EventHandler.make", "RefSubject.set", ".value=${query}"],
  "render-scheduling": ["MixedRenderQueue", "SyncRenderQueue", "CurrentRenderPriority"],
  "render-event-substrate": ["DomRenderEvent", "HtmlRenderEvent"],
  "dom-render-event": ["DomRenderEvent", "Fx.periodic", "Effect.forkScoped"],
  "html-render-event": ["HtmlRenderEvent"],
  "wire-and-rendered-dom-output": ["persistent", "fromComments", "DomRenderEvent"],
  "template-compilation-pipeline": ["@typed/template/Parser", "templateToHtmlChunks", "addTemplateHash"],
  "implementing-render-template": ["RenderTemplate", "Layer.effect", "Fx.tap"],
  "event-source-delegation": ["makeEventSource", "addEventListener", "events.setup", "Scope.Scope"],
};
const readGuide = (slug: string) => parseGuideDocumentation(
  `${slug}.md`, fs.readFileSync(path.join(guideDirectory, `${slug}.md`), "utf8"),
);
const linkedGuides = (body: string) => Array.from(
  body.matchAll(/\]\(\/explore\/([^#)]+)(?:#[^)]*)?\)/g), (match) => match[1],
);

describe("public Template curriculum", () => {
  it("demonstrates public contracts with self-contained examples in integrated Template groups", () => {
    const documents = Object.entries(groups).flatMap(([section, slugs]) => slugs.map((slug) => {
      const guide = readGuide(slug);
      expect(guide.section, slug).toBe(section);
      const examples = extractTypeScriptFences(guide.body);
      expect(examples.length, slug).toBeGreaterThan(0);
      const source = examples.join("\n");
      for (const contract of demonstratedContracts[slug]) {
        expect(source, `${slug}: ${contract}`).toContain(contract);
      }
      expect(source, slug).not.toMatch(/from\s+["']@typed\/template\/internal\//);
      return guide;
    }));
    expect(validateAuthoredExampleQuality(documents)).toEqual([]);
  });

  it("connects the first view to every Template topic through valid learning links", () => {
    const documents = new Map(Object.values(groups).flat().map((slug) => [slug, readGuide(slug)]));
    for (const [slug, guide] of documents) {
      const links = linkedGuides(guide.body);
      expect(links.length, `${slug} has related learning`).toBeGreaterThan(0);
      for (const link of links) {
        expect(fs.existsSync(path.join(guideDirectory, `${link}.md`)), `${slug} links to ${link}`).toBe(true);
      }
    }
    const reachable = new Set<string>();
    const pending = ["render-your-first-template"];
    while (pending.length > 0) {
      const slug = pending.pop()!;
      if (reachable.has(slug)) continue;
      reachable.add(slug);
      const guide = documents.get(slug);
      if (guide) pending.push(...linkedGuides(guide.body).filter((link) => documents.has(link)));
    }
    expect([...documents.keys()].filter((slug) => !reachable.has(slug))).toEqual([]);
  });
});
