/**
 * CoreServices are the services that are available to all Typed applications.
 * @since 1.0.0
 */

import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import type { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import { GetRandomValues, getRandomValues } from "@typed/id/GetRandomValues"
import * as Navigation from "@typed/navigation"
import { browser as CurrentRouteBrowser, type CurrentRoute } from "@typed/router/CurrentRoute"
import { serverLayer, staticLayer } from "@typed/template/Html"
import { hydrateLayer } from "@typed/template/Hydrate"
import { renderLayer } from "@typed/template/Render"
import type * as RenderContext from "@typed/template/RenderContext"
import * as RenderQueue from "@typed/template/RenderQueue"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

/**
 * CoreServices are the services that are available to all Typed applications.
 * @since 1.0.0
 */
export type CoreServices =
  | CurrentEnvironment
  | GetRandomValues
  | Navigation.Navigation
  | CurrentRoute
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate

/**
 * @since 1.0.0
 */
export type CoreDomServices = DomServices | CoreServices

/**
 * @since 1.0.0
 */
export function fromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly queue?: "raf" | "sync" | "mixed" | ["idle", IdleRequestOptions] }
): Layer.Layer<CoreDomServices> {
  return Layer.mergeAll(
    GetRandomValues.implement((length: number) =>
      Effect.succeed(window.crypto.getRandomValues(new Uint8Array(length)))
    ),
    Navigation.fromWindow,
    CurrentRouteBrowser
  ).pipe(Layer.provideMerge(renderLayer(window, options)), Layer.provideMerge(makeQueueLayer(options?.queue ?? "raf")))
}

/**
 * @since 1.0.0
 */
export function hydrateFromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly queue?: "raf" | "sync" | ["idle", IdleRequestOptions] }
): Layer.Layer<CoreDomServices> {
  return Layer.mergeAll(
    GetRandomValues.implement((length: number) =>
      Effect.succeed(window.crypto.getRandomValues(new Uint8Array(length)))
    ),
    Navigation.fromWindow,
    CurrentRouteBrowser
  ).pipe(Layer.provideMerge(hydrateLayer(window, options)), Layer.provideMerge(makeQueueLayer(options?.queue ?? "raf")))
}

/**
 * @since 1.0.0
 */
export const server: Layer.Layer<Exclude<CoreServices, Navigation.Navigation | CurrentRoute>> = Layer.mergeAll(
  getRandomValues,
  serverLayer,
  RenderQueue.sync
)

/**
 * @since 1.0.0
 */
const static_: Layer.Layer<Exclude<CoreServices, Navigation.Navigation | CurrentRoute>> = Layer.mergeAll(
  getRandomValues,
  staticLayer,
  RenderQueue.sync
)

export {
  /**
   * @since 1.0.0
   */
  static_ as static
}

function makeQueueLayer(type: "raf" | "sync" | "mixed" | ["idle", IdleRequestOptions]) {
  switch (type) {
    case "raf":
      return RenderQueue.raf
    case "sync":
      return RenderQueue.sync
    case "mixed":
      return RenderQueue.mixed()
    default:
      return RenderQueue.idle(type[1])
  }
}
