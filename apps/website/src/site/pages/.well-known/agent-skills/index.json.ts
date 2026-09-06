import { artifactUrl } from "../../../Artifacts.js";

export const GET = () =>
  Response.json({
    skills: [
      {
        name: "typed",
        description:
          "Find current Typed APIs, compose Effect-based programs, and verify ownership boundaries.",
        url: artifactUrl("/agent-skills/typed/SKILL.md"),
      },
    ],
  });
