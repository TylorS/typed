/**
 * Low-level Effect wrappers for DOM APIS and usage from the Context.
 * @since 8.19.0
 */

import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as C from "@typed/context"

import { Document } from "./Document"
import { GlobalThis } from "./GlobalThis"
import { History } from "./History"
import { Location } from "./Location"
import { Navigator } from "./Navigator"
import { ParentElement } from "./ParentElement"
import { RootElement } from "./RootElement"
import { Window } from "./Window"

/**
 * All of the core DOM services
 * @since 8.19.0
 * @category models
 */
export type DomServices =
  | GlobalThis
  | Window
  | Document
  | RootElement
  | ParentElement
  | History
  | Location
  | Navigator

/**
 * All of the core DOM services accessible via a single interfae
 * @since 8.19.0
 * @category context
 */
export const DomServices: C.Tagged<
  DomServices,
  {
    readonly globalThis: GlobalThis
    readonly window: Window
    readonly document: Document
    readonly rootElement: RootElement
    readonly parentElement: ParentElement
    readonly history: History
    readonly location: Location
    readonly navigator: Navigator
  }
> = C.struct({
  globalThis: GlobalThis,
  window: Window,
  document: Document,
  rootElement: RootElement,
  parentElement: ParentElement,
  history: History,
  location: Location,
  navigator: Navigator
})

/**
 * Parameters for creating DomServices
 * @since 8.19.0
 * @category params
 */
export type DomServicesParams = {
  readonly window: Window
  readonly globalThis: GlobalThis
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
}

/**
 * Create a DomServices Context
 * @since 8.19.0
 * @category constructors
 */
export const makeDomServices = (params: DomServicesParams): C.Context<DomServices> => {
  const { globalThis, window } = params
  const { document, history, location, navigator } = window
  const { context } = DomServices.build({
    globalThis,
    window,
    document,
    rootElement: { rootElement: params.rootElement || document.body },
    parentElement: { parentElement: params.parentElement || document.body },
    history,
    location,
    navigator
  })

  return context
}

/**
 * The elements to use for the root and parent elements
 * @since 8.19.0
 * @category params
 */
export type DomServicesElementParams = {
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
}

/**
 * Provide DOM services to an Effect
 * @since 8.19.0
 * @category context
 */
export const provideDomServices = (window: Window & GlobalThis, params?: DomServicesElementParams) =>
<R, E, A>(
  effect: Effect.Effect<R | DomServices, E, A>
): Effect.Effect<Exclude<R, DomServices>, E, A> =>
  Effect.provideSomeContext(
    effect,
    makeDomServices({
      window,
      globalThis: window,
      ...params
    })
  )

/**
 * Create a Layer for DOM services that depend on a Window and GlobalThis
 *
 * @since 8.19.0
 * @category context
 */
export const domServices = (
  params?: DomServicesElementParams
): Layer.Layer<Window | GlobalThis, never, DomServices> =>
  Layer.effectContext(
    Window.withEffect((window) =>
      GlobalThis.with((globalThis) =>
        makeDomServices({
          window,
          globalThis,
          ...params
        })
      )
    )
  )
