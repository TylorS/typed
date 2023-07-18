import { pipe } from '@effect/data/Function'
import * as Data from '@effect/data/Data'
import * as HashMap from '@effect/data/HashMap'
import * as Maybe from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Ref from '@effect/io/Ref'
import * as Scope from '@effect/io/Scope'
import * as Runtime from '@effect/io/Runtime'
import * as C from '@typed/context'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export interface IntersectionObserverManager {
  readonly get: (
    options: IntersectionObserverInit,
  ) => Effect.Effect<never, never, globalThis.IntersectionObserver>

  readonly observe: (
    element: Element,
    options: IntersectionObserverInit,
  ) => Fx.Fx<Scope.Scope, never, IntersectionObserverEntry>
}

export const makeIntersectionObserverManager: Effect.Effect<
  GlobalThis,
  never,
  IntersectionObserverManager
> = Effect.gen(function* ($) {
  const globalThis = yield* $(GlobalThis)

  // Use HashMap for value-equality checks on keys for options.
  // There will only ever be 1 observer per set of options.
  const observers = yield* $(
    Ref.make<HashMap.HashMap<IntersectionObserverInit, InternalObserver>>(HashMap.empty()),
  )

  const fork = Runtime.runFork(yield* $(Effect.runtime<never>()))

  const get = (options: IntersectionObserverInit) => {
    const optionsData = Data.struct(options)

    return pipe(
      observers,
      Ref.get,
      Effect.map(HashMap.get(optionsData)),
      Effect.flatMap(
        Maybe.match({
          onNone: () => observers.modify((map) => {
            const subject = Fx.makeSubject<never, IntersectionObserverEntry>()
            const intersectionObserver = new globalThis.IntersectionObserver(
              (entries) => fork(Effect.all(entries.map((e) => subject.event(e)))),
              options
            )

            const observer: InternalObserver = [intersectionObserver, subject]

            return [observer, HashMap.set(map, optionsData, observer)]
          }),
          onSome: Effect.succeed,
        })
      )
    )
  }

  const observer: IntersectionObserverManager = {
    get: (options) =>
      pipe(
        options,
        get,
        Effect.map(([observer]) => observer),
      ),
    observe: (element, options) =>
      pipe(
        Fx.make<Scope.Scope, never, IntersectionObserverEntry>((sink) =>
          pipe(
            options,
            get,
            Effect.flatMap(([observer, subject]) =>
              pipe(
                Effect.sync(() => observer.observe(element)),
                Effect.zipRight(
                  Effect.addFinalizer(() => Effect.sync(() => observer.unobserve(element))),
                ),
                Effect.zipRight(subject.run(sink)),
              ),
            ),
          ),
        ),
        Fx.filter((e) => e.target === element),
        Fx.multicast,
      ),
  }

  return observer
})

export const IntersectionObserverManager = C.Tag<IntersectionObserverManager>(
  '@typed/dom/IntersectionObserverManager',
)

type InternalObserver = readonly [
  globalThis.IntersectionObserver,
  Fx.Subject<never, IntersectionObserverEntry>,
]
