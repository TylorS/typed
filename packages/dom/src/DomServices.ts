import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as C from '@typed/context'

import { Document } from './Document.js'
import { Fetch } from './Fetch.js'
import { GlobalThis } from './GlobalThis.js'
import { History } from './History.js'
import { Location } from './Location.js'
import { Navigator } from './Navigator.js'
import { ParentElement } from './ParentElement.js'
import { RootElement } from './RootElement.js'
import { Window } from './Window.js'

export type DomServices =
  | GlobalThis
  | Window
  | Document
  | RootElement
  | ParentElement
  | History
  | Location
  | Navigator
  | Fetch

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
    readonly fetch: Fetch
  }
> = C.struct({
  globalThis: GlobalThis,
  window: Window,
  document: Document,
  rootElement: RootElement,
  parentElement: ParentElement,
  history: History,
  location: Location,
  navigator: Navigator,
  fetch: Fetch,
})

export type DomServicesParams = {
  readonly window: Window
  readonly globalThis: GlobalThis
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
}

export const makeDomServices = (params: DomServicesParams): C.Context<DomServices> => {
  const { window, globalThis } = params
  const { document, history, location, navigator, fetch } = window
  const { context } = DomServices.build({
    globalThis,
    window,
    document,
    rootElement: { rootElement: params.rootElement || document.body },
    parentElement: { parentElement: params.parentElement || document.body },
    history,
    location,
    navigator,
    fetch,
  })

  return context
}

export type DomServicesElementParams = {
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
}

export const provideDomServices =
  (window: Window & GlobalThis, params?: DomServicesElementParams) =>
  <R, E, A>(
    effect: Effect.Effect<R | DomServices, E, A>,
  ): Effect.Effect<Exclude<R, DomServices>, E, A> =>
    Effect.provideSomeContext(
      effect,
      makeDomServices({
        window,
        globalThis: window,
        ...params,
      }),
    )

export const domServices = (
  params?: DomServicesElementParams,
): Layer.Layer<Window | GlobalThis, never, DomServices> =>
  Layer.effectContext(
    Window.withEffect((window) =>
      GlobalThis.with((globalThis) =>
        makeDomServices({
          window,
          globalThis,
          ...params,
        }),
      ),
    ),
  )
