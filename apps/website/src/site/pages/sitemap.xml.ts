import { getCollection } from "astro:content";
import { inventory } from "../Reference.js";
import { siteHref } from "../../SiteHref.js";
import { counterLessonPath, isQuickStartSection } from "../../tutorial/Routes.js";

export async function GET() {
  const paths = [
    "/",
    "/explore",
    "/explore/quick-start",
    "/explore/tutorial",
    "/explore/storybook",
    "/integrate",
    "/reference",
    "/glossary",
    ...(await getCollection("learn"))
      .filter(({ data }) => !isQuickStartSection(data.id))
      .map(({ data }) => counterLessonPath(data.id)),
    ...(await getCollection("guides")).map(({ id }) => `/explore/${id}`),
    ...(await getCollection("recipes")).map(({ data }) => `/integrate/${data.slug}`),
    ...(await getCollection("tutorial")).map(({ data }) => `/explore/tutorial/${data.slug}`),
    ...inventory.routes.map(({ canonicalPath }) => canonicalPath),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>https://tylors.github.io${siteHref(path).replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
