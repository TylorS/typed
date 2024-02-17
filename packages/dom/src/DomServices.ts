/**
 * Low-level Effect wrappers for DOM APIS and usage from the Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

import { Document } from "./Document.js"
import { GlobalThis } from "./GlobalThis.js"
import { History } from "./History.js"
import { Location } from "./Location.js"
import { Navigator } from "./Navigator.js"
import { ParentElement } from "./ParentElement.js"
import { RootElement } from "./RootElement.js"
import { Window } from "./Window.js"

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
export const DomServices: Context.TaggedStruct<
  {
    readonly globalThis: Context.Tagged<GlobalThis, GlobalThis>
    readonly window: Context.Tagged<Window, Window>
    readonly document: Context.Tagged<Document, Document>
    readonly rootElement: Context.Tagged<RootElement, RootElement>
    readonly parentElement: Context.Tagged<ParentElement, ParentElement>
    readonly history: Context.Tagged<History, History>
    readonly location: Context.Tagged<Location, Location>
    readonly navigator: Context.Tagged<Navigator, Navigator>
  }
> = Context.struct({
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
  readonly rootElement?: HTMLElement | undefined
  readonly parentElement?: HTMLElement | undefined
}

/**
 * Create a DomServices Context
 * @since 8.19.0
 * @category constructors
 */
export const makeDomServices = (params: DomServicesParams): Context.Context<DomServices> => {
  const { globalThis, window } = params
  const { document, history, location, navigator } = window
  const { context } = DomServices.build({
    globalThis,
    window,
    document,
    rootElement: { rootElement: params.rootElement || document.body },
    parentElement: { parentElement: params.parentElement || params.rootElement || document.body },
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
  readonly rootElement?: HTMLElement | undefined
  readonly parentElement?: HTMLElement | undefined
}

/**
 * Provide DOM services to an Effect
 * @since 8.19.0
 * @category context
 */
export const provideDomServices = (window: Window & GlobalThis, params?: DomServicesElementParams) =>
<R, E, A>(
  effect: Effect.Effect<A, E, R | DomServices>
): Effect.Effect<A, E, Exclude<R, DomServices>> =>
  Effect.provide(
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
): Layer.Layer<DomServices, never, Window | GlobalThis> =>
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
