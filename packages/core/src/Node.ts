/// <reference types="vite/client" />
/// <reference types="@typed/vite-plugin/virtual-modules" />

import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import { runMain } from "@effect/platform-node/NodeRuntime"
import * as Http from "@effect/platform/HttpServer"
import type { RunMain } from "@effect/platform/Runtime"
import type { CurrentEnvironment } from "@typed/environment"
import type { GetRandomValues } from "@typed/id"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import type { Scope } from "effect"
import { Effect, Layer, Logger, LogLevel } from "effect"
import { dual } from "effect/Function"
import { createServer } from "node:http"
import viteHttpServer from "vavite/http-dev-server"
import typedOptions from "virtual:typed-options"
import * as CoreServices from "./CoreServices.js"
import { staticFiles } from "./Platform.js"

/**
 * TODO: Allow configuration of the server for HTTPS and HTTP2
 *
 * @since 1.0.0
 */
export function getOrCreateServer() {
  if (viteHttpServer === undefined) {
    return createServer()
  } else {
    let effectUpgradeHandler: ((req: any, socket: any, head: any) => void) | undefined
    let combinedUpgradeHandler: ((req: any, socket: any, head: any) => void) | undefined

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
        } else if (
          prop === "on"
        ) {
          return (...args: Parameters<NonNullable<typeof viteHttpServer>["on"]>) => {
            // We don't want to utilize Effect's default websocket upgrade handling to allow HMR to continue working
            if (args[0] === "upgrade" && effectUpgradeHandler === undefined) {
              const [viteHmrListener] = Array.from(new Set(viteHttpServer!.listeners(args[0])))

              effectUpgradeHandler = args[1]
              combinedUpgradeHandler = (req, socket, head) => {
                if (req.headers["sec-websocket-protocol"] === "vite-hmr") {
                  return viteHmrListener(req, socket, head)
                } else {
                  return args[1](req, socket, head)
                }
              }

              // Remove the vite listener since it will be replaced with our combined listener
              target.off("upgrade", viteHmrListener as any)
              return target.on("upgrade", combinedUpgradeHandler)
            }

            return target.on(...args)
          }
        } else if (prop === "off") {
          return (...args: Parameters<NonNullable<typeof viteHttpServer>["off"]>) => {
            if (args[0] === "upgrade" && args[1] === effectUpgradeHandler && combinedUpgradeHandler !== undefined) {
              target.off("upgrade", combinedUpgradeHandler)
              effectUpgradeHandler = undefined
              combinedUpgradeHandler = undefined
            }

            return target.off(...args)
          }
        }

        return Reflect.get(target, prop)
      }
    })
  }
}

/**
 * @since 1.0.0
 */
export type Options = {
  readonly serverDirectory: string
  readonly port?: number
  readonly static?: boolean
  readonly serveStatic?: boolean
  readonly logLevel?: LogLevel.LogLevel
}

const logServerAddress = Effect.gen(function*(_) {
  const server = yield* _(Http.server.Server)
  const address = server.address._tag === "UnixAddress"
    ? server.address.path
    : `${server.address.hostname}:${server.address.port}`

  yield* _(Effect.log(`Listening on ${address}`))
})

export const listen: {
  (options: Options): <R, E>(
    app: Http.app.Default<R, E>
  ) => Effect.Effect<
    never,
    Http.error.ServeError,
    Exclude<
      Exclude<
        Exclude<
          Exclude<
            Exclude<R, Http.request.ServerRequest | Scope.Scope>,
            Http.server.Server | Http.platform.Platform | Http.etag.Generator | NodeContext.NodeContext
          >,
          NodeContext.NodeContext
        >,
        | CurrentEnvironment
        | GetRandomValues
        | RenderContext.RenderContext
        | RenderQueue.RenderQueue
        | RenderTemplate
      >,
      Scope.Scope
    >
  >

  <R, E>(
    app: Http.app.Default<R, E>,
    options: Options
  ): Effect.Effect<
    never,
    Http.error.ServeError,
    Exclude<
      Exclude<
        Exclude<
          Exclude<
            Exclude<R, Http.request.ServerRequest | Scope.Scope>,
            Http.server.Server | Http.platform.Platform | Http.etag.Generator | NodeContext.NodeContext
          >,
          NodeContext.NodeContext
        >,
        | CurrentEnvironment
        | GetRandomValues
        | RenderContext.RenderContext
        | RenderQueue.RenderQueue
        | RenderTemplate
      >,
      Scope.Scope
    >
  >
} = dual(2, function listen<R, E>(app: Http.app.Default<R, E>, options: Options) {
  return app.pipe(
    staticFiles(options.serverDirectory, options?.serveStatic ?? import.meta.env.PROD, typedOptions),
    Http.middleware.logger,
    (app) =>
      Effect.zipRight(
        logServerAddress,
        Layer.launch(Http.server.serve(app))
      ),
    Effect.provide(NodeHttpServer.server.layer(getOrCreateServer, options)),
    Effect.provide(NodeContext.layer),
    Effect.provide(options.static ? CoreServices.static : CoreServices.server),
    Effect.scoped,
    Logger.withMinimumLogLevel(options.logLevel ?? LogLevel.Info)
  )
})

export const run: RunMain = runMain
