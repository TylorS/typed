import { ServerResponse, ServerRouterBuilder } from "@typed/server"
import { Effect } from "effect"
import { handleArticles } from "./articles/handlers"
import { handleComments } from "./comments/handlers"
import { handleProfiles } from "./profiles/handlers"
import { Spec } from "./spec"
import { handleGetTags } from "./tags/handlers"
import { handleUsers } from "./users/handlers"

export const server = ServerRouterBuilder.make(Spec, { enableDocs: true, docsPath: "/docs" }).pipe(
  handleArticles,
  handleComments,
  handleProfiles,
  handleGetTags,
  handleUsers,
  ServerRouterBuilder.build,
  // Handle API errors
  Effect.catchTag("RouteDecodeError", (_) => ServerResponse.json(_, { status: 400 })),
  Effect.catchTag("Unauthorized", () => ServerResponse.empty({ status: 401 })),
  Effect.catchTag("RouteNotMatched", () => ServerResponse.empty({ status: 404 }))
)
