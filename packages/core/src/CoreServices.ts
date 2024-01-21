/**
 * CoreServices are the services that are available to all Typed applications.
 * @since 1.0.0
 */

import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import type { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import { GetRandomValues } from "@typed/id"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import * as RenderContext from "@typed/template/RenderContext"
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

/**
 * Construct CoreServices from a browser's Window object
 * @since 1.0.0
 */
export function fromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
): Layer.Layer<never, never, CoreServices | DomServices> {
  const getRandomValues = (length: number) => window.crypto.getRandomValues(new Uint8Array(length))
  return Layer.provideMerge(
    Layer.mergeAll(
      GetRandomValues.layer((length) => Effect.sync(() => getRandomValues(length))),
      Navigation.fromWindow,
      Router.browser
    ),
    RenderContext.dom(window, options)
  )
}
