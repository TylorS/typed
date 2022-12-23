import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Ref from '@effect/io/Ref'
import * as T from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'
import * as HashMap from '@fp-ts/data/HashMap'
import * as Maybe from '@fp-ts/data/Option'
import * as Fx from '@typed/fx'

import { GlobalThis } from './GlobalThis.js'

export interface IntersectionObserverManager {
  readonly get: (
    options: IntersectionObserverInit,
  ) => Effect.Effect<never, never, globalThis.IntersectionObserver>

  readonly observe: (
    element: Element,
    options: IntersectionObserverInit,
  ) => Fx.Fx<never, never, IntersectionObserverEntry>
}

export namespace IntersectionObserverManager {
  export const Tag: T.Tag<IntersectionObserverManager> = T.Tag<IntersectionObserverManager>()

  export const make: Effect.Effect<GlobalThis, never, IntersectionObserverManager> = Effect.gen(
    function* ($) {
      const globalThis = yield* $(GlobalThis.get)

      // Use HashMap for value-equality checks on keys for options.
      // There will only ever be 1 observer per set of options.
      const observers = yield* $(
        Ref.make<HashMap.HashMap<IntersectionObserverInit, InternalObserver>>(HashMap.empty()),
      )

      const get = (options: IntersectionObserverInit) =>
        pipe(
          observers,
          Ref.get,
          Effect.map(HashMap.get(options)),
          Effect.flatMap(
            Maybe.match(
              () =>
                observers.modify((map) => {
                  const subject = Fx.Subject.unsafeMake<never, IntersectionObserverEntry>()
                  const intersectionObserver = new globalThis.IntersectionObserver(
                    (entries) => entries.forEach((e) => subject.event(e)),
                    options,
                  )

                  const observer: InternalObserver = [intersectionObserver, subject]

                  return [observer, HashMap.set(options, observer)(map)]
                }),
              Effect.succeed,
            ),
          ),
        )

      const observer: IntersectionObserverManager = {
        get: (options) =>
          pipe(
            options,
            get,
            Effect.map(([observer]) => observer),
          ),
        observe: (element, options) =>
          pipe(
            Fx.Fx<never, never, IntersectionObserverEntry>((sink) =>
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
    },
  )

  export const live = Layer.fromEffect(IntersectionObserverManager.Tag)(make)
}

type InternalObserver = readonly [
  globalThis.IntersectionObserver,
  Fx.Subject<never, IntersectionObserverEntry>,
]
