import * as Http from "@effect/platform-node/HttpServer"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/Runtime"
import viteHttpServer from "@giacomorebonato/vavite/http-dev-server"
import viteDevServer from "@giacomorebonato/vavite/vite-dev-server"
import { Storage } from "@typed/dom/Storage"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { html, RenderContext, renderToHtmlString } from "@typed/template"
import { htmlResponse } from "@typed/template/Platform"
import { Effect, Layer } from "effect"
import { mockStorage } from "mock-storage"
import { createServer } from "node:http"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

const template = html`<html>
  <head>
    <title>@typed TodoMVC</title>
    <meta charset="utf-8" />
    <meta name="description" content="@typed TodoMVC" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    ${TodoApp}

    <script async defer type="module" src="./index.ts"></script>
  </body>
</html>`

const server = Http.router.empty.pipe(
  Http.router.get(
    "/",
    Effect.gen(function*(_) {
      const request = yield* _(Http.request.ServerRequest)
      const layer = Live.pipe(
        Layer.provideMerge(Layer.mergeAll(
          Navigation.initialMemory({
            url: request.url
          }),
          Router.server("/"),
          Storage.layer(mockStorage())
        ))
      )

      if (viteDevServer) {
        let html = yield* _(renderToHtmlString(template), Effect.provide(layer))

        console.log(html)

        html = yield* _(Effect.promise(() => viteDevServer!.transformIndexHtml(request.url, html)))

        return Http.response.raw(html, { contentType: "text/html" })
      }

      return yield* _(
        htmlResponse(template),
        Effect.provide(layer)
      )
    })
  ),
  Http.server.serve(Http.middleware.logger)
)

const ServerLive = Http.server.layer(() => getOrCreateServer(), { port: 3000 })

const HttpLive = server.pipe(
  Layer.provide(ServerLive),
  Layer.provide(NodeContext.layer),
  Layer.provide(RenderContext.server)
)

HttpLive.pipe(
  Layer.launch,
  Effect.scoped,
  Effect.tapErrorCause(Effect.logError),
  runMain
)

function getOrCreateServer() {
  if (typeof viteHttpServer === "undefined") {
    return createServer()
  }

  // Vite's http server will already be running by the time we get here, but
  // we want to ensure that the Effect Http server is able to call `server.listen(options, cb)`
  // to allow it to continue doing work after it can recognize the server is listening
  return new Proxy(viteHttpServer, {
    get(target, key) {
      if (key === "listen") {
        return new Proxy(target[key], {
          apply(_, __, args) {
            // Call any listeners
            args.find((x) => typeof x === "function")?.()
          }
        })
      } else return target[key as keyof typeof target]
    }
  })
}
