import { HttpServer } from "@effect/platform"
import { runMain } from "@effect/platform-node/NodeRuntime"
import { toHttpRouter } from "@typed/core/Platform"
import { Effect } from "effect"
import { NodeServer } from "effect-http-node"
import { ApiLive } from "./api/infrastructure/Live"
import { RealworldApiServer } from "./api/server"
import { document } from "./client/document"
import { router } from "./client/router"

// TODO: Handle 404 + other Errors

toHttpRouter(router, { layout: document }).pipe(
  HttpServer.router.mountApp("/api", RealworldApiServer),
  HttpServer.middleware.logger,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(ApiLive),
  runMain
)
