/**
 * @since 1.0.0
 */

/// <reference types="vite/client" />
/// <reference types="@typed/vite-plugin-types" />

import type { Etag, HttpApp, HttpServerError, HttpServerRequest } from "@effect/platform"
import { HttpMiddleware, HttpServer } from "@effect/platform"
import { NodeContext, NodeHttpServer } from "@effect/platform-node"
import type { HttpPlatform } from "@effect/platform/HttpPlatform"
import { defaultTeardown } from "@effect/platform/Runtime"
import { CurrentEnvironment, Environment } from "@typed/environment"
import type { GetRandomValues } from "@typed/id"
import * as Route from "@typed/route"
import { CurrentRoute, makeCurrentRoute } from "@typed/router"
import type { RenderContext, RenderQueue, RenderTemplate } from "@typed/template"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import * as LogLevel from "effect/LogLevel"
import type { RunForkOptions } from "effect/Runtime"
import type * as Scope from "effect/Scope"
import { createServer } from "node:http"
import viteHttpServer from "vavite/http-dev-server"
import * as typedOptions from "virtual:typed-options"
import * as CoreServices from "./CoreServices.js"
import { staticFiles, staticFilesMiddleware } from "./Platform.js"

const EFFECT_HANDLER = Symbol.for("@typed/core/Node/EffectHandler")
const EFFECT_UPGRADE_HANDLER_TYPEID = Symbol.for("@typed/core/Node/EffectUpgradeHandler")

const ALL_PROCESS_INTERRUPTS: Array<NodeJS.Signals> = [
  "SIGABRT",
  "SIGINT",
  "SIGQUIT",
  "SIGTERM",
  "SIGKILL"
]

type Handler = (req: any, socket: any, head: any) => void

type CombinedHandler = Handler & {
  [EFFECT_UPGRADE_HANDLER_TYPEID]: {
    readonly vite: Handler
    readonly effect: Handler
  }
}

function makeEffectUpgradeHandler(vite: Handler, effect: Handler): CombinedHandler {
  function combined(req: any, socket: any, head: any) {
    if (req.headers["sec-websocket-protocol"] === "vite-hmr") {
      return vite(req, socket, head)
    } else {
      return effect(req, socket, head)
    }
  }

  return Object.assign(combined, {
    [EFFECT_UPGRADE_HANDLER_TYPEID]: {
      vite,
      effect
    }
  })
}

function findViteHmrListener(server: NonNullable<typeof viteHttpServer>) {
  return Array.from(server.listeners("upgrade")).find((listener) => {
    return !(EFFECT_UPGRADE_HANDLER_TYPEID in listener)
  }) as Handler | undefined
}

function findCombinedHandler(server: NonNullable<typeof viteHttpServer>) {
  return Array.from(server.listeners("upgrade")).find((listener) => {
    return EFFECT_UPGRADE_HANDLER_TYPEID in listener
  }) as CombinedHandler | undefined
}

function removeCombinedHandler(server: NonNullable<typeof viteHttpServer>, combinedHandler: CombinedHandler) {
  server.off("upgrade", combinedHandler)
  server.on("upgrade", combinedHandler[EFFECT_UPGRADE_HANDLER_TYPEID].vite)
}

function removeEffectHandlers(server: NonNullable<typeof viteHttpServer>) {
  server.listeners("upgrade").forEach((listener) => {
    if (EFFECT_HANDLER in listener) {
      server.off("upgrade", listener as any)
    }
  })

  server.listeners("request").forEach((listener) => {
    if (EFFECT_HANDLER in listener) {
      server.off("request", listener as any)
    }
  })
}

/**
 * TODO: Allow configuration of the server for HTTPS and HTTP2
 *
 * @since 1.0.0
 */
export function getOrCreateServer() {
  if (viteHttpServer === undefined) {
    return createServer()
  } else {
    let combinedUpgradeHandler: CombinedHandler | undefined = findCombinedHandler(viteHttpServer)

    if (combinedUpgradeHandler !== undefined) {
      removeCombinedHandler(viteHttpServer, combinedUpgradeHandler)
      combinedUpgradeHandler = undefined
    }

    // Attempt to remove any pre-existing effect handlers, due to HMR
    removeEffectHandlers(viteHttpServer)

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
                removeCombinedHandler(viteHttpServer!, combinedUpgradeHandler)
                combinedUpgradeHandler = undefined
              }

              const viteHmrListener = findViteHmrListener(viteHttpServer!) as Handler
              // Remove the vite listener since it will be replaced with our combined listener
              target.off("upgrade", viteHmrListener!)

              combinedUpgradeHandler = makeEffectUpgradeHandler(viteHmrListener, args[1])

              return target.on("upgrade", combinedUpgradeHandler)
            }

            Object.assign(args[1], { [EFFECT_HANDLER]: EFFECT_HANDLER })

            return target.on.apply(target, args as any)
          }
        } else if (prop === "off") {
          return (...args: Parameters<NonNullable<typeof viteHttpServer>["off"]>) => {
            // Here we need to proxy to the listener we really added
            if (
              args[0] === "upgrade" && combinedUpgradeHandler !== undefined &&
              args[1] === combinedUpgradeHandler[EFFECT_UPGRADE_HANDLER_TYPEID].effect
            ) {
              removeCombinedHandler(viteHttpServer!, combinedUpgradeHandler)
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
  readonly cacheControl?: (filePath: string) => { readonly maxAge: number; readonly immutable?: boolean }
}

const logServerAddress = Effect.gen(function*() {
  const server = yield* HttpServer.HttpServer
  const address = server.address._tag === "UnixAddress"
    ? server.address.path
    : `${server.address.hostname}:${server.address.port}`

  yield* Effect.log(`Listening on ${address}`)
})

const defaultHtmlCacheControl = { maxAge: 0 } as const
const defaultFileCacheControl = { maxAge: 60 * 60 * 24 * 365, immutable: true } as const
const defaultCacheControl = (filePath: string) => {
  if (filePath.endsWith(".html")) {
    return defaultHtmlCacheControl
  }

  return defaultFileCacheControl
}

/**
 * @since 1.0.0
 */
export const listen: {
  (options: Options): <E, R>(
    app: HttpApp.Default<E, R>
  ) => Effect.Effect<
    never,
    HttpServerError.HttpServerError,
    Exclude<
      R,
      | HttpServerRequest.HttpServerRequest
      | Scope.Scope
      | HttpServer.HttpServer
      | HttpPlatform
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
    >
  >

  <E, R>(
    app: HttpApp.Default<E, R>,
    options: Options
  ): Effect.Effect<
    never,
    HttpServerError.HttpServerError,
    Exclude<
      R,
      | HttpServerRequest.HttpServerRequest
      | Scope.Scope
      | HttpServer.HttpServer
      | HttpPlatform
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
    >
  >
} = dual(2, function listen<E, R>(app: HttpApp.Default<E, R>, options: Options) {
  return app.pipe(
    staticFiles({
      serverOutputDirectory: options.serverDirectory,
      enabled: options?.serveStatic ?? import.meta.env.PROD,
      options: typedOptions,
      cacheControl: options?.cacheControl ?? defaultCacheControl
    }),
    HttpMiddleware.logger,
    (app) =>
      Effect.zipRight(
        logServerAddress,
        Layer.launch(HttpServer.serve(app))
      ),
    Effect.provide(NodeHttpServer.layer(getOrCreateServer, options)),
    Effect.provide(options.static ? CoreServices.static : CoreServices.server),
    Effect.scoped,
    Logger.withMinimumLogLevel(options.logLevel ?? LogLevel.Info)
  )
})

/**
 * @since 1.0.0
 */
export const layer = (
  options: Options
): Layer.Layer<
  | HttpPlatform
  | HttpServer.HttpServer
  | Etag.Generator
  | NodeContext.NodeContext
  | CurrentEnvironment
  | GetRandomValues
  | CurrentRoute
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate,
  HttpServerError.ServeError
> =>
  staticFilesMiddleware({
    serverOutputDirectory: options.serverDirectory,
    enabled: options?.serveStatic ?? import.meta.env.PROD,
    options: typedOptions,
    cacheControl: options?.cacheControl ?? defaultCacheControl
  }).pipe(
    Layer.provideMerge(NodeHttpServer.layer(getOrCreateServer, options)),
    Layer.provideMerge(options.static ? CoreServices.static : CoreServices.server)
  )

/**
 * @since 1.0.0
 */
export const run = <A, E>(
  effect: Effect.Effect<A, E, NodeContext.NodeContext | CurrentEnvironment | CurrentRoute>,
  options?: RunForkOptions & { readonly static?: boolean; readonly base?: string }
): Disposable => {
  const program = effect.pipe(
    Effect.tapErrorCause((cause) =>
      Cause.isInterruptedOnly(cause) ? Effect.void : Effect.logError(`Application Failure`, cause)
    ),
    Effect.provide(NodeContext.layer),
    CurrentEnvironment.provide(options?.static ? Environment.static : Environment.server),
    CurrentRoute.provide(makeCurrentRoute(Route.parse(options?.base ?? "/")))
  )
  const keepAlive = setInterval(() => {}, 2 ** 31 - 1)
  const fiber = Effect.runFork(program, options)

  fiber.addObserver((exit) => {
    clearInterval(keepAlive)
    defaultTeardown(exit, (code) => process.exit(code))
  })

  function onDispose() {
    clearInterval(keepAlive)
    ALL_PROCESS_INTERRUPTS.forEach((signal) => process.off(signal, onDispose))
    fiber.unsafeInterruptAsFork(fiber.id())
  }

  ALL_PROCESS_INTERRUPTS.forEach((signal) => process.once(signal, onDispose))

  if (import.meta.hot) {
    import.meta.hot.dispose(onDispose)
  }

  return {
    [Symbol.dispose]: onDispose
  }
}

/**
 * @since 1.0.0
 */
export const launch = <A, E>(
  layer: Layer.Layer<A, E, NodeContext.NodeContext | CurrentEnvironment | CurrentRoute | Scope.Scope>,
  options?: RunForkOptions & { readonly static?: boolean; readonly base?: string }
): Disposable => {
  return run(Effect.scoped(Layer.launch(layer)), options)
}
