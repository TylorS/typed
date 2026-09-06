import type { APIRoute } from "astro";
import {
  authoredArticles,
  markdownResponse,
  renderArticle,
  type MarkdownArticle,
} from "../../Artifacts.js";

export async function getStaticPaths() {
  return (await authoredArticles())
    .filter(({ path }) => path.startsWith("/explore/"))
    .map((entry) => ({
      params: { document: entry.path.slice("/explore/".length) },
      props: { entry },
    }));
}

export const GET: APIRoute = ({ props }) =>
  markdownResponse(renderArticle(props.entry as MarkdownArticle));
