import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Env } from '@tsplus/stdlib/service/Env'

import { Document } from './Document.js'
import { Fetch } from './Fetch.js'
import { GlobalThis } from './GlobalThis.js'
import { History } from './History.js'
import { Location } from './Location.js'
import { Navigator } from './Navigator.js'
import { ParentElement } from './ParentElement.js'
import { Window } from './Window.js'

export type DOMServices =
  | GlobalThis
  | Window
  | Document
  | ParentElement
  | History
  | Location
  | Navigator
  | Fetch

export const makeDOMServices = (window: Window & GlobalThis): Env<DOMServices> =>
  Env(Window.Tag, window)
    .add(GlobalThis.Tag, window)
    .add(Document.Tag, window.document)
    .add(ParentElement.Tag, { parentElement: window.document.body })
    .add(History.Tag, window.history)
    .add(Location.Tag, window.location)
    .add(Navigator.Tag, window.navigator)
    .add(Fetch.Tag, window.fetch)

export const provideDOMServices =
  (window: Window & GlobalThis) =>
  <R, E, A>(
    effect: Effect.Effect<R | DOMServices, E, A>,
  ): Effect.Effect<Exclude<R, DOMServices>, E, A> =>
    pipe(
      effect,
      Effect.provideSomeEnvironment((env: Env<Exclude<R, DOMServices>>) =>
        (env as Env<R>).merge(makeDOMServices(window)),
      ),
    )
