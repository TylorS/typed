import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import * as C from '@typed/context'

import { Document } from './Document.js'
import { Fetch } from './Fetch.js'
import { GlobalThis } from './GlobalThis.js'
import { History } from './History.js'
import { Location } from './Location.js'
import { Navigator } from './Navigator.js'
import { ParentElement } from './ParentElement.js'
import { Window } from './Window.js'
import { attachShadowRoots } from './declarative-shadow-dom.js'

export type DomServices =
  | GlobalThis
  | Window
  | Document
  | ParentElement
  | History
  | Location
  | Navigator
  | Fetch

export const makeDomServices = (window: Window, globalThis: GlobalThis): C.Context<DomServices> =>
  Window.build(window)
    .add(GlobalThis, globalThis)
    .add(Document, window.document)
    .add(ParentElement, { parentElement: window.document.body })
    .add(History, window.history)
    .add(Location, window.location)
    .add(Navigator, window.navigator)
    .add(Fetch, window.fetch).context

export const provideDomServices =
  (window: Window & GlobalThis) =>
  <R, E, A>(
    effect: Effect.Effect<R | DomServices, E, A>,
  ): Effect.Effect<Exclude<R, DomServices>, E, A> =>
    pipe(
      // If the environment doesn't support declarative shadow-dom, polyfill by attaching shadow roots
      attachShadowRoots,
      Effect.zipRight(effect),
      Effect.provideSomeEnvironment((env: C.Context<Exclude<R, DomServices>>) =>
        pipe(env as C.Context<R>, C.merge(makeDomServices(window, window))),
      ),
    )

export const domServices = Layer.fromEffectEnvironment(
  Window.withEffect((w) => GlobalThis.with((g) => makeDomServices(w, g))),
)
