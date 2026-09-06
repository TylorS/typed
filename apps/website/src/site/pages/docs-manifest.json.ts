import { inventory } from "../Reference.js";
import { siteHref } from "../../SiteHref.js";
import { authoredArticles } from "../Artifacts.js";

export const GET = async () =>
  Response.json({
    schemaVersion: 1,
    canonical: `https://tylors.github.io${siteHref("/")}`,
    counts: {
      packages: inventory.packages.length,
      modules: inventory.modules.length,
      uniqueExports: inventory.uniqueExportCount,
    },
    routes: inventory.routes.map((route) => ({
      ...route,
      canonicalPath: siteHref(route.canonicalPath),
      markdownPath: siteHref(route.markdownPath),
      jsonPath: siteHref(route.jsonPath),
    })),
    articles: (await authoredArticles()).map(({ path, markdownPath, title, summary }) => ({
      title,
      summary,
      canonicalPath: siteHref(path),
      markdownPath: siteHref(markdownPath),
    })),
  });
