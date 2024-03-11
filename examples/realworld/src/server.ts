import * as Api from "@/api"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { runMain } from "@effect/platform-node/NodeRuntime"
import * as Http from "@effect/platform/HttpServer"
import { Effect, Layer, pipe } from "effect"
import { NodeSwaggerFiles } from "effect-http-node"
import { createServer } from "node:http"
import viteHttpServer from "vavite/http-dev-server"

Http.router.empty.pipe(
  Http.router.mountApp("/api", Api.server),
  listen,
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
