import { HttpServer } from "@effect/platform"
import { runMain } from "@effect/platform-node/NodeRuntime"
import { serverLayer } from "@typed/template"
import { toHttpRouter } from "@typed/ui/Platform"
import { Effect } from "effect"
import { NodeServer } from "effect-http-node"
import { ApiLive } from "./api/infrastructure/Live"
import { RealworldApiServer } from "./api/server"
import { document } from "./client/document"
import { router } from "./client/router"

toHttpRouter(router, document).pipe(
  HttpServer.router.mountApp("/api", RealworldApiServer),
  // TODO: Handle 404 + other Errors
  HttpServer.middleware.logger,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(ApiLive),
  Effect.provide(serverLayer),
  runMain
)
