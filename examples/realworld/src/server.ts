import { Route, Router } from "@typed/core"
import * as Node from "@typed/core/Node"
import { toHttpApiRouter } from "@typed/core/Platform"
import { HttpApiBuilder, HttpMiddleware } from "@typed/server"
import { Layer, Logger, LogLevel } from "effect"
import * as Api from "./api"
import * as Ui from "./ui"

HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(Api.RealworldApi.pipe(
    Layer.provide(Router.prefix(Route.literal("api")))
  )),
  Layer.provide(toHttpApiRouter(Ui.router, { layout: Ui.document, clientEntry: "browser" })),
  Layer.provide(Router.prefix(Route.literal("realworld"))),
  Layer.provide(Node.layer({ port: 3000, serverDirectory: import.meta.dirname })),
  Layer.provide(Logger.minimumLogLevel(LogLevel.Debug)),
  Node.launch
)
