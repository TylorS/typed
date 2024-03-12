/// <reference types="vite/client" />

import * as Api from "@/api"
import { DbLive } from "@/api/common/infrastructure/db"
import * as Ui from "@/ui"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { runMain } from "@effect/platform-node/NodeRuntime"
import type { PlatformError } from "@effect/platform/Error"
import { FileSystem } from "@effect/platform/FileSystem"
import * as Http from "@effect/platform/HttpServer"
import * as CoreServices from "@typed/core/CoreServices"
import { toHttpRouter } from "@typed/core/Platform"
import type { TypedOptions } from "@typed/vite-plugin"
import type { Scope } from "effect"
import { ConfigProvider, Effect, identity, Layer, Logger, LogLevel } from "effect"
import { NodeSwaggerFiles } from "effect-http-node"
import { createServer } from "node:http"
import { join, resolve } from "node:path"
import viteHttpServer from "vavite/http-dev-server"
import options from "virtual:typed-options"

toHttpRouter(Ui.router, { layout: Ui.layout }).pipe(
  staticFiles(import.meta.dirname, import.meta.env.PROD, options),
  Http.router.mountApp("/api", Api.server),
  Http.middleware.logger,
  (app) =>
    Effect.zipRight(
      Effect.gen(function*(_) {
        const server = yield* _(Http.server.Server)
        const address = server.address._tag === "UnixAddress"
          ? server.address.path
          : `${server.address.hostname}:${server.address.port}`

        yield* _(Effect.log(`Listening on ${address}`))
      }),
      Layer.launch(Http.server.serve(app))
    ),
  Effect.provide(DbLive),
  Effect.provide(NodeHttpServer.server.layer(() => getOrCreateServer(), { port: 3000 })),
  Effect.provide(NodeSwaggerFiles.SwaggerFilesLive),
  Effect.provide(NodeContext.layer),
  Effect.provide(CoreServices.server),
  // Using import.meta.env directly like this is no recommended in production
  // as your environment variables will be inlined in the code, but here it is for convenience.
  Effect.provide(Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env))),
  Effect.scoped,
  Logger.withMinimumLogLevel(import.meta.env.PROD ? LogLevel.Info : LogLevel.Debug),
  runMain
)

function staticFiles(
  serverOutputDirectory: string,
  enabled: boolean,
  options: TypedOptions
): <R, E>(
  self: Http.router.Router<R, E>
) => Http.router.Router<
  FileSystem | Http.platform.Platform | Exclude<R, Scope.Scope | Http.request.ServerRequest | Http.router.RouteContext>,
  PlatformError | E
> {
  const addStaticFileServer = Http.router.mountApp(
    `/${options.assetDirectory}`,
    Effect.gen(function*(_) {
      const request = yield* _(Http.request.ServerRequest)
      const fs = yield* _(FileSystem)
      const filePath = resolve(serverOutputDirectory, join(options.relativeServerToClientOutputDirectory, request.url))

      if (yield* _(fs.exists(filePath + ".gz"))) {
        return yield* _(
          Http.response.file(filePath + ".gz", {
            headers: Http.headers.unsafeFromRecord({ "Content-Encoding": "gzip" })
          })
        )
      }

      return yield* _(Http.response.file(filePath))
    }),
    { includePrefix: true }
  )

  return enabled ? addStaticFileServer : identity as any
}

function getOrCreateServer() {
  if (viteHttpServer === undefined) {
    return createServer()
  } else {
    return new Proxy(viteHttpServer, {
      get(target, prop) {
        // Proxy the listen method to call the callback so Effect will continue to run
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
