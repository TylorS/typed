import { getCollection } from "astro:content";
import { inventory } from "../Reference.js";
import { siteHref } from "../../SiteHref.js";

export async function GET() {
  const guides = (await getCollection("guides")).sort((a, b) => a.data.order - b.data.order);
  const origin = "https://tylors.github.io";
  return new Response(
    [
      "# Typed",
      "",
      "> A TypeScript toolkit built on Effect for reactive applications, accessible UI, and composable libraries.",
      "",
      "## Learn",
      ...guides.map(
        ({ id, data }) =>
          `- [${data.title}](${origin}${siteHref(`/explore/${id}`)}): ${data.summary}`,
      ),
      "",
      "## API reference",
      ...inventory.packages.map(
        (pkg) =>
          `- [${pkg.packageName}](${origin}${siteHref(`/reference/packages/${encodeURI(pkg.packageName)}`)}): ${pkg.uniqueExportCount} unique exports`,
      ),
      "",
      `- [Reference manifest](${origin}${siteHref("/docs-manifest.json")}): exhaustive page, Markdown, and JSON routes`,
      `- [Full reference Markdown](${origin}${siteHref("/docs/reference/llms-full.txt")})`,
      "- [Effect v4](https://effect.website/docs/v4/): underlying runtime, errors, services, and resources",
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
