import { pipe } from '@effect/data/Function'

import { Effect, Fiber, Option, Ref, RefS, Scope } from './externals.js'

export type ScopedFork = <R2, E2, B>(
  effect: Effect.Effect<R2, E2, B>,
) => Effect.Effect<R2, never, Fiber.RuntimeFiber<E2, B>>

export function withScopedFork<R, E, A>(f: (fork: ScopedFork) => Effect.Effect<R, E, A>) {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => f(Effect.forkIn(scope)),
    (scope, exit) => Scope.close(scope, exit),
  )
}

export type ForkFxFiber = <R2>(
  effect: Effect.Effect<R2, never, void>,
) => Effect.Effect<R2, never, Fiber.RuntimeFiber<never, void>>

export function withUnboundedConcurrency<R, E, A>(
  f: (fork: ForkFxFiber) => Effect.Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    Effect.gen(function* ($) {
      const fibers = new Set<Fiber.RuntimeFiber<never, void>>()

      yield* $(
        f((effect) =>
          Effect.gen(function* ($) {
            const fiber = yield* $(fork(effect))

            fibers.add(fiber)

            // Ensure that the fiber is removed from the set when it finishes
            yield* $(
              Fiber.join(fiber),
              Effect.ensuring(Effect.sync(() => fibers.delete(fiber))),
              // but don't allow this to be blocking
              fork,
            )

            return fiber
          }),
        ),
      )

      // Wait for all fibers to complete
      if (fibers.size > 0) {
        yield* $(Fiber.joinAll(fibers))
      }
    }),
  )
}

export type ForkFx = <R2>(eff: Effect.Effect<R2, never, void>) => Effect.Effect<R2, never, void>

export function withSwitch<R, E, A>(f: (switchFork: ForkFx) => Effect.Effect<R, E, A>) {
  return withScopedFork((fork) =>
    Effect.gen(function* ($) {
      const ref = yield* $(RefS.make<Fiber.Fiber<never, void>>(Fiber.unit()))

      const switchFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
        RefS.updateEffect(ref, (currentFiber) =>
          pipe(
            Fiber.interruptFork(currentFiber),
            Effect.flatMap(() => fork(eff)),
          ),
        )

      yield* $(f(switchFork))

      const fiber = yield* $(RefS.get(ref))

      // Wait for last fiber to complete
      if (fiber) {
        yield* $(Fiber.join(fiber))
      }
    }),
  )
}

export function withExhaust<R, E, A>(f: (exhaustFork: ForkFx) => Effect.Effect<R, E, A>) {
  return withScopedFork((fork) =>
    Effect.gen(function* ($) {
      const ref = yield* $(Ref.make<Fiber.Fiber<never, void> | void>(undefined))
      const reset = Ref.set(ref, undefined)

      const exhaustFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
        Effect.gen(function* ($) {
          const currentFiber = yield* $(Ref.get(ref))

          if (currentFiber) {
            return
          }

          const fiber = yield* $(eff, Effect.ensuring(reset), fork)

          yield* $(Ref.set(ref, fiber))
        })

      yield* $(f(exhaustFork))

      const fiber = yield* $(Ref.get(ref))

      // Wait for last fiber to complete
      if (fiber) {
        yield* $(Fiber.join(fiber))
      }
    }),
  )
}

export function withExhaustLatest<R, E, A>(
  f: (exhaustLatestFork: ForkFx) => Effect.Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    Effect.gen(function* ($) {
      const ref = yield* $(Ref.make<Fiber.Fiber<never, void> | void>(undefined))
      const nextEffect = yield* $(
        Ref.make<Option.Option<Effect.Effect<any, never, void>>>(Option.none()),
      )
      const reset = Ref.set(ref, undefined)

      // Wait for the current fiber to finish
      const awaitNext = Effect.gen(function* ($) {
        // Wait for the last fiber to finish
        const fiber = yield* $(Ref.get(ref))

        if (fiber) {
          // Wait for the fiber to end to check to see if we need to run another
          yield* $(Fiber.join(fiber))
        }
      })

      // Run the next value that's be saved for replay if it exists
      const runNext: Effect.Effect<any, never, void> = Effect.gen(function* ($) {
        const next = yield* $(Ref.get(nextEffect))

        if (Option.isSome(next)) {
          // Clear the next A to be replayed
          yield* $(Ref.set(nextEffect, Option.none()))

          // Replay the next A
          yield* $(exhaustLatestFork(next.value))

          // Ensure we don't close the scope until the last fiber completes
          yield* $(awaitNext)
        }
      })

      const exhaustLatestFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
        Effect.gen(function* ($) {
          const currentFiber = yield* $(Ref.get(ref))

          if (currentFiber) {
            return yield* $(Ref.set(nextEffect, Option.some(eff)))
          }

          const fiber = yield* $(eff, Effect.ensuring(Effect.zip(reset, runNext)), fork)

          yield* $(RefS.set(ref, fiber))
        })

      yield* $(f(exhaustLatestFork))

      // Wait for last fibers to complete
      yield* $(awaitNext)
    }),
  )
}
