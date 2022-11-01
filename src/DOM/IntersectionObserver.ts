import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as Ref from '@effect/core/io/Ref'
import * as ImmutableMap from '@tsplus/stdlib/collections/ImmutableMap'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Maybe from '@tsplus/stdlib/data/Maybe'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { GlobalThis, getGlobalThis } from './GlobalThis.js'

export interface IntersectionObserverManager {
  readonly get: (
    options: IntersectionObserverInit,
  ) => Effect.Effect<never, never, globalThis.IntersectionObserver>

  readonly observe: (
    element: Element,
    options: IntersectionObserverInit,
  ) => Fx.Fx<never, never, IntersectionObserverEntry>
}

type InternalObserver = readonly [
  globalThis.IntersectionObserver,
  Fx.Subject<never, IntersectionObserverEntry>,
]

export const intersectionObserverManager: Layer.Layer<
  GlobalThis,
  never,
  IntersectionObserverManager
> = Layer.fromEffect(IntersectionObserverManager.Tag)(
  Effect.gen(function* ($) {
    const globalThis = yield* $(getGlobalThis)

    // Use ImmutableMap for value-equality checks on keys for options.
    // There will only ever be 1 observer per set of options.
    const observers = yield* $(
      Ref.makeRef<ImmutableMap.ImmutableMap<IntersectionObserverInit, InternalObserver>>(() =>
        ImmutableMap.empty(),
      ),
    )

    const get = (options: IntersectionObserverInit) =>
      pipe(
        observers.get,
        Effect.map(ImmutableMap.get(options)),
        Effect.flatMap(
          Maybe.fold(
            () =>
              observers.modify((map) => {
                const subject = Fx.Subject.unsafeMake<never, IntersectionObserverEntry>()
                const intersectionObserver = new globalThis.IntersectionObserver(
                  (entries) => entries.forEach((e) => subject.emit(e)),
                  options,
                )

                const observer: InternalObserver = [intersectionObserver, subject]

                return [observer, ImmutableMap.set(options, observer)(map)]
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
          Fx.Fx<never, never, IntersectionObserverEntry>((emitter) =>
            pipe(
              options,
              get,
              Effect.flatMap(([observer, subject]) =>
                pipe(
                  Effect.sync(() => observer.observe(element)),
                  Effect.zipRight(
                    Effect.addFinalizer(Effect.sync(() => observer.unobserve(element))),
                  ),
                  Effect.zipRight(subject.run(emitter)),
                ),
              ),
            ),
          ),
          Fx.filter((e) => e.target === element),
          Fx.multicast,
        ),
    }

    return observer
  }),
)

export namespace IntersectionObserverManager {
  export const Tag: T.Tag<IntersectionObserverManager> = T.Tag<IntersectionObserverManager>()

  export const live = intersectionObserverManager
}
