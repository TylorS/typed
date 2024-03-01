import { HttpServer } from "@effect/platform"
import { runMain } from "@effect/platform-node/NodeRuntime"
import { toHttpRouter } from "@typed/core/Platform"
import { Effect, Logger, LogLevel } from "effect"
import { NodeServer } from "effect-http-node"
import { PrettyLogger } from "effect-log"
import * as Api from "./api"
import { ApiLive } from "./api/infrastructure/Live"
import * as Client from "./client/index"

// TODO: Handle 404 + other Errors

toHttpRouter(Client.router, { layout: Client.document }).pipe(
  HttpServer.router.mountApp("/api", Api.RealworldApiServer),
  HttpServer.middleware.logger,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(ApiLive),
  Effect.provide(PrettyLogger.layer()),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  runMain
)
