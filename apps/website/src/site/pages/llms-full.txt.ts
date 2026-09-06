import { artifactUrl, authoredArticles, renderArticle } from "../Artifacts.js";

export async function GET() {
  const content = (await authoredArticles()).map(renderArticle).join("\n\n---\n\n");
  return new Response(
    `${content}\n\n---\n\n# Complete API reference\n\n[Read every public declaration and example](${artifactUrl("/docs/reference/llms-full.txt")}).\n`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}
