/**
 * CoreServices are the services that are available to all Typed applications.
 * @since 1.0.0
 */

import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import type { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import { GetRandomValues, getRandomValues } from "@typed/id"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { hydrateLayer, renderLayer, serverLayer, staticLayer } from "@typed/template"
import type * as RenderContext from "@typed/template/RenderContext"
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
  | Router.CurrentRoute
  | RenderContext.RenderContext
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
  options?: DomServicesElementParams & {
    readonly skipRenderScheduling?: boolean
  }
): Layer.Layer<CoreDomServices> {
  return Layer.mergeAll(
    GetRandomValues.implement((length: number) =>
      Effect.succeed(window.crypto.getRandomValues(new Uint8Array(length)))
    ),
    Navigation.fromWindow,
    Router.browser
  ).pipe(Layer.provideMerge(renderLayer(window, options)))
}
/**
 * @since 1.0.0
 */
export function hydrateFromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & {
    readonly skipRenderScheduling?: boolean
  }
): Layer.Layer<CoreDomServices> {
  return Layer.mergeAll(
    GetRandomValues.implement((length: number) =>
      Effect.succeed(window.crypto.getRandomValues(new Uint8Array(length)))
    ),
    Navigation.fromWindow,
    Router.browser
  ).pipe(Layer.provideMerge(hydrateLayer(window, options)))
}

/**
 * @since 1.0.0
 */
export function server(
  options: Navigation.InitialMemoryOptions
): Layer.Layer<CoreServices> {
  return Layer.mergeAll(
    getRandomValues,
    Navigation.initialMemory(options),
    Router.server(options.base),
    serverLayer
  )
}

/**
 * @since 1.0.0
 */
function static_(
  options: Navigation.InitialMemoryOptions
): Layer.Layer<CoreServices> {
  return Layer.mergeAll(
    getRandomValues,
    Navigation.initialMemory(options),
    Router.server(options.base),
    staticLayer
  )
}

export {
  /** */
  static_ as static
}
