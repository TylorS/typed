import * as Server from "@effect/platform-node/Http/Server"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/NodeRuntime"
import * as HttpServer from "@effect/platform/HttpServer"
import { html, staticLayer } from "@typed/template"
import { htmlResponse } from "@typed/template/Platform"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"

const template = html`<!DOCTYPE html>
<html>
  <head>
    <title>Typed SSR</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>`

const server = HttpServer.router.empty.pipe(
  HttpServer.router.get("/", htmlResponse(template)),
  HttpServer.server.serve(HttpServer.middleware.logger)
)

const HttpLive = server.pipe(
  Layer.provide(Server.layer(() => createServer(), { port: 3000 })),
  Layer.provide(NodeContext.layer),
  Layer.provide(staticLayer)
)

HttpLive.pipe(
  Layer.launch,
  Effect.scoped,
  Effect.tapErrorCause(Effect.logError),
  runMain
)
