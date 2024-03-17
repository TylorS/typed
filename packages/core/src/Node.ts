/// <reference types="vite/client" />
/// <reference types="@typed/vite-plugin-types" />

import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import * as Http from "@effect/platform/HttpServer"
import { defaultTeardown } from "@effect/platform/Runtime"
import type { CurrentEnvironment } from "@typed/environment"
import type { GetRandomValues } from "@typed/id"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import type { Scope } from "effect"
import { Cause, Effect, Layer, Logger, LogLevel } from "effect"
import { dual } from "effect/Function"
import type { RunForkOptions } from "effect/Runtime"
import { createServer } from "node:http"
import viteHttpServer from "vavite/http-dev-server"
import * as typedOptions from "virtual:typed-options"
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
    let effectRequestHandler: ((req: any, res: any) => void) | undefined
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
          // Proxy the "on" method to allow us to intercept the "upgrade" and "request" event listeners
          // to support HMR and static file serving and to ensure only one listener is added at a time.
          // Without this, Effect's Websocket upgrade handling will intercept Vite's HMR websocket upgrade
          // and will fail, causing the UI to refresh forever.
          prop === "on"
        ) {
          return (...args: readonly [string, ...Array<any>]) => {
            // We don't want to utilize Effect's default websocket upgrade handling to allow HMR to continue working
            if (args[0] === "upgrade") {
              if (combinedUpgradeHandler !== undefined) {
                target.off("upgrade", combinedUpgradeHandler)
              }

              const [viteHmrListener] = Array.from(new Set(viteHttpServer!.listeners(args[0])))

              // Remove the vite listener since it will be replaced with our combined listener
              target.off("upgrade", viteHmrListener as any)

              effectUpgradeHandler = args[1]
              combinedUpgradeHandler = (req, socket, head) => {
                if (req.headers["sec-websocket-protocol"] === "vite-hmr") {
                  return viteHmrListener(req, socket, head)
                } else {
                  return effectUpgradeHandler!(req, socket, head)
                }
              }

              return target.on("upgrade", combinedUpgradeHandler)
            }

            // Here we track the request listener to ensure only one is added at a time
            if (args[0] === "request" && effectRequestHandler === undefined) {
              if (effectRequestHandler !== undefined) {
                target.off("request", effectRequestHandler)
              }

              effectRequestHandler = args[1]
              return target.on.apply(target, args as any)
            }
            return target.on.apply(target, args as any)
          }
        } else if (prop === "off") {
          return (...args: Parameters<NonNullable<typeof viteHttpServer>["off"]>) => {
            // Here we need to proxy to the listener we really added
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
      R,
      | Http.request.ServerRequest
      | Scope.Scope
      | Http.server.Server
      | Http.platform.Platform
      | Http.etag.Generator
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
    >
  >

  <R, E>(
    app: Http.app.Default<R, E>,
    options: Options
  ): Effect.Effect<
    never,
    Http.error.ServeError,
    Exclude<
      R,
      | Http.request.ServerRequest
      | Scope.Scope
      | Http.server.Server
      | Http.platform.Platform
      | Http.etag.Generator
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
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
    Effect.provide(options.static ? CoreServices.static : CoreServices.server),
    Effect.scoped,
    Logger.withMinimumLogLevel(options.logLevel ?? LogLevel.Info)
  )
})

export const run = <A, E>(
  effect: Effect.Effect<A, E, NodeContext.NodeContext>,
  options?: RunForkOptions
): Disposable => {
  const program = effect.pipe(
    Effect.tapErrorCause((cause) => Cause.isInterruptedOnly(cause) ? Effect.unit : Effect.logError(cause)),
    Effect.provide(NodeContext.layer)
  )
  const keepAlive = setInterval(() => {}, 2 ** 31 - 1)
  const fiber = Effect.runFork(program, options)

  fiber.addObserver((exit) => {
    clearInterval(keepAlive)
    defaultTeardown(exit, (code) => process.exit(code))
  })

  function onDispose() {
    clearInterval(keepAlive)
    process.removeListener("SIGINT", onDispose)
    process.removeListener("SIGTERM", onDispose)
    fiber.unsafeInterruptAsFork(fiber.id())
  }

  process.once("SIGINT", onDispose)
  process.once("SIGTERM", onDispose)

  return {
    [Symbol.dispose]: onDispose
  }
}
