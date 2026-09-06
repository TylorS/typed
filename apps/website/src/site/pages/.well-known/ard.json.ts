import { artifactUrl } from "../../Artifacts.js";

export const GET = () =>
  Response.json({
    version: "1",
    name: "Typed",
    description: "Static documentation for Typed libraries built on Effect.",
    resources: [
      { type: "documentation", url: artifactUrl("/llms.txt") },
      { type: "documentation", url: artifactUrl("/llms-full.txt") },
      { type: "manifest", url: artifactUrl("/docs-manifest.json") },
      { type: "search-index", url: artifactUrl("/search-index.json") },
      { type: "schema", url: artifactUrl("/schemas/documentation-v1.json") },
      { type: "skills", url: artifactUrl("/.well-known/agent-skills/index.json") },
    ],
  });
