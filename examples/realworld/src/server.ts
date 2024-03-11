/// <reference types="vite/client" />

import * as Api from "@/api"
import * as Ui from "@/ui"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { runMain } from "@effect/platform-node/NodeRuntime"
import * as Http from "@effect/platform/HttpServer"
import { toHttpRouter } from "@typed/core/Platform"
import { Effect, Layer, Logger, LogLevel, pipe } from "effect"
import { NodeSwaggerFiles } from "effect-http-node"
import { existsSync } from "node:fs"
import { createServer } from "node:http"
import viteHttpServer from "vavite/http-dev-server"

const StaticFiles = Effect.gen(function*(_) {
  const request = yield* _(Http.request.ServerRequest)
  const filePath = request.url.replace("/assets", "dist/client/assets")

  if (existsSync(filePath + ".gz")) {
    return yield* _(
      Http.response.file(filePath + ".gz", { headers: Http.headers.unsafeFromRecord({ "Content-Encoding": "gzip" }) })
    )
  }

  return yield* _(Http.response.file(filePath))
})

toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  Http.router.mountApp("/assets", StaticFiles, { includePrefix: true }),
  Http.router.mountApp("/api", Api.server),
  Http.router.get("*", Http.response.html`<h1>Not Found</h1>`),
  Http.middleware.logger,
  listen,
  Logger.withMinimumLogLevel(import.meta.env.PROD ? LogLevel.Info : LogLevel.Debug),
  runMain
)

function listen<R, E>(router: Http.app.Default<R, E>) {
  return pipe(
    Effect.gen(function*(_) {
      const server = yield* _(Http.server.Server)
      const address = server.address._tag === "UnixAddress"
        ? server.address.path
        : `${server.address.hostname}:${server.address.port}`

      yield* _(Effect.log(`Listening on ${address}`))
    }),
    Effect.flatMap(() => Layer.launch(Http.server.serve(router))),
    Effect.scoped,
    Effect.provide(NodeHttpServer.server.layer(() => getOrCreateServer(), { port: 3000 })),
    Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
    Effect.provide(NodeContext.layer)
  )
}

function getOrCreateServer() {
  if (viteHttpServer === undefined) {
    return createServer()
  } else {
    return new Proxy(viteHttpServer, {
      get(target, prop) {
        if (prop === "listen") {
          return (...args: any) => {
            const fn = args.find((arg: any) => typeof arg === "function")
            if (fn) {
              fn()
            }
          }
        }
        return Reflect.get(target, prop)
      }
    })
  }
}
