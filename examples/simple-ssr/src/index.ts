import * as Http from "@effect/platform-node/HttpServer"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/Runtime"
import { html, htmlResponse, RenderContext } from "@typed/template"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"

const template = html`<html>
  <head>
    <title>Typed SSR</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>`

const server = Http.router.empty.pipe(
  Http.router.get("/", htmlResponse(template)),
  Http.server.serve(Http.middleware.logger)
)

const ServerLive = Http.server.layer(() => createServer(), { port: 3000 })

const HttpLive = Layer.scopedDiscard(server).pipe(
  Layer.use(ServerLive),
  Layer.use(NodeContext.layer),
  Layer.use(RenderContext.server())
)

Layer.launch(HttpLive).pipe(
  Effect.tapErrorCause(Effect.logError),
  runMain
)
