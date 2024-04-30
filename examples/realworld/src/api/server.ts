import { ServerRouterBuilder } from "@typed/server"
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
  ServerRouterBuilder.build
)
