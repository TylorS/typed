import { getCollection } from "astro:content";
import { glossaryEntries } from "../generated/glossary.js";
import { siteHref } from "../SiteHref.js";
import { resolveMarkdownLinks } from "../docs/MarkdownLinks.js";
import { canonicalReferencePath } from "../docs/Reference.js";
import { inventory } from "./Reference.js";
import { expandCurriculumSources } from "../tutorial/Files.js";
import { counterLessonPath, isQuickStartSection } from "../tutorial/Routes.js";

export const artifactUrl = (path: string): string =>
  `https://tylors.github.io${siteHref(canonicalReferencePath(path))}`;

export interface MarkdownArticle {
  readonly path: string;
  readonly markdownPath: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
}

const article = (path: string, title: string, summary: string, body: string): MarkdownArticle => ({
  path,
  markdownPath: path === "/" ? "/index.md" : `${path}.md`,
  title,
  summary,
  body,
});

export const renderArticle = (entry: MarkdownArticle): string =>
  resolveMarkdownLinks(
    [
      `# ${entry.title}`,
      "",
      entry.summary,
      "",
      `Canonical: ${artifactUrl(entry.path)}`,
      "",
      entry.body,
      "",
    ].join("\n"),
    artifactUrl,
  );

export const markdownResponse = (markdown: string): Response =>
  new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });

const list = (entries: ReadonlyArray<MarkdownArticle>): string =>
  entries
    .map((entry) => `- [${entry.title}](${artifactUrl(entry.markdownPath)}): ${entry.summary}`)
    .join("\n");

/** Authored documents and indexes, independent of the HTML renderer and any HTTP service. */
export async function authoredArticles(): Promise<ReadonlyArray<MarkdownArticle>> {
  const [guides, recipes, learn, tutorial] = await Promise.all([
    getCollection("guides"),
    getCollection("recipes"),
    getCollection("learn"),
    getCollection("tutorial"),
  ]);
  const guideArticles = guides
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ id, data, body }) => article(`/explore/${id}`, data.title, data.summary, body ?? ""));
  const recipeArticles = recipes
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map(({ data, body }) =>
      article(`/integrate/${data.slug}`, data.title, data.summary, body ?? ""),
    );
  const tutorialArticles = tutorial
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data, body }) =>
      article(
        `/explore/tutorial/${data.slug}`,
        data.title,
        data.summary,
        expandCurriculumSources(body ?? ""),
      ),
    );
  const counterArticles = learn
    .filter(({ data }) => !isQuickStartSection(data.id))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data, body }) =>
      article(
        counterLessonPath(data.id),
        data.title,
        data.summary,
        expandCurriculumSources(body ?? ""),
      ),
    );
  const quickStart = article(
    "/explore/quick-start",
    "Build a counter",
    "Two files and a few commands. Click the counter, then make it your own.",
    [
      learn
        .filter(({ data }) => isQuickStartSection(data.id))
        .sort((a, b) => a.data.order - b.data.order)
        .map(({ data, body }) => `## ${data.title}\n\n${expandCurriculumSources(body ?? "")}`)
        .join("\n\n---\n\n"),
      "## Keep going",
      list(counterArticles),
      `[Build a Todo app](${artifactUrl("/explore/tutorial.md")}) with forms, lists, and persistence.`,
    ].join("\n\n"),
  );
  const tutorialIndex = article(
    "/explore/tutorial",
    "Build TodoMVC with Typed",
    "Build a client-side application through domain models, state, rendering, routing, and persistence.",
    list(tutorialArticles),
  );
  return [
    article(
      "/",
      "Typed — Cooperative by design",
      "A TypeScript toolkit built on Effect for reactive applications, accessible UI, and composable libraries.",
      [
        "Typed is just a toolkit. Compose producer-driven work with Fx, retain writable state with RefSubject, and render through templates or an existing framework.",
        list([quickStart, tutorialIndex]),
        `- [Explore](${artifactUrl("/explore.md")})\n- [Integration recipes](${artifactUrl("/integrate.md")})\n- [API reference](${artifactUrl("/reference.md")})\n- [Glossary](${artifactUrl("/glossary.md")})`,
      ].join("\n\n"),
    ),
    article(
      "/explore",
      "Explore Typed",
      "Learn the tools through application problems and complete examples.",
      list([quickStart, ...counterArticles, tutorialIndex, ...guideArticles]),
    ),
    quickStart,
    ...counterArticles,
    tutorialIndex,
    ...tutorialArticles,
    ...guideArticles,
    article(
      "/integrate",
      "Integrate Typed",
      "Compose Typed with existing DOM, HTML, frameworks, and application hosts.",
      list(recipeArticles),
    ),
    ...recipeArticles,
    article(
      "/reference",
      "Typed API reference",
      "Inspect the current public package, module, and symbol contracts.",
      [
        ...inventory.packages.map(
          (pkg) =>
            `- [${pkg.packageName}](${artifactUrl(`/reference/packages/${encodeURI(pkg.packageName)}`)}): ${pkg.uniqueExportCount} unique exports`,
        ),
        "",
        `- [Reference manifest](${artifactUrl("/docs-manifest.json")})`,
        `- [Complete reference Markdown](${artifactUrl("/docs/reference/llms-full.txt")})`,
        `- [Documentation JSON Schema](${artifactUrl("/schemas/documentation-v1.json")})`,
      ].join("\n"),
    ),
    article(
      "/glossary",
      "Typed glossary",
      "Shared terms for reactive state, rendering, and ownership.",
      glossaryEntries
        .map((entry) => `## ${entry.term}\n\n${entry.definition}\n\n${entry.details}`)
        .join("\n\n"),
    ),
  ];
}

export async function articleResponse(path: string): Promise<Response> {
  const entry = (await authoredArticles()).find((entry) => entry.path === path);
  if (entry === undefined) return new Response("Document not found", { status: 404 });
  return markdownResponse(renderArticle(entry));
}
