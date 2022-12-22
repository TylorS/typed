import * as Effect from '@effect/io/Effect'
import * as Context from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

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

export const makeDomServices = (window: Window & GlobalThis): Context.Context<DomServices> =>
  pipe(
    Context.empty(),
    Context.add(Window.Tag)(window),
    Context.add(GlobalThis.Tag)(window),
    Context.add(Document.Tag)(window.document),
    Context.add(ParentElement.Tag)({ parentElement: window.document.body }),
    Context.add(History.Tag)(window.history),
    Context.add(Location.Tag)(window.location),
    Context.add(Navigator.Tag)(window.navigator),
    Context.add(Fetch.Tag)(window.fetch),
  )

export const provideDomServices =
  (window: Window & GlobalThis) =>
  <R, E, A>(
    effect: Effect.Effect<R | DomServices, E, A>,
  ): Effect.Effect<Exclude<R, DomServices>, E, A> =>
    pipe(
      // If the environment doesn't support declarative shadow-dom, polyfill by attaching shadow roots
      attachShadowRoots,
      Effect.zipRight(effect),
      Effect.provideSomeEnvironment((env: Context.Context<Exclude<R, DomServices>>) =>
        pipe(env as Context.Context<R>, Context.merge(makeDomServices(window))),
      ),
    )
