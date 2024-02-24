import { HttpServer } from "@effect/platform"
import { runMain } from "@effect/platform-node/NodeRuntime"
import { Effect } from "effect"
import { NodeServer } from "effect-http-node"
import { ApiLive } from "./api/infrastructure/Live"
import { RealworldApiServer } from "./api/server"

RealworldApiServer.pipe(
  HttpServer.middleware.logger,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(ApiLive),
  runMain
)
