import { pipe } from "@effect/data/Function"
import type { Option } from "@effect/data/Option"
import { isSome, none, some } from "@effect/data/Option"
import type { Effect } from "@effect/io/Effect"
import {
  acquireUseRelease,
  ensuring,
  flatMap,
  forkIn,
  gen,
  sync,
  zip,
} from "@effect/io/Effect"
import type { Fiber, RuntimeFiber } from "@effect/io/Fiber"
import { interruptFork, join, joinAll, unit } from "@effect/io/Fiber"
import { get, make as makeRef, set } from "@effect/io/Ref"
import {
  make as makeSynchronized,
  updateEffect,
} from "@effect/io/Ref/Synchronized"
import { close, make as makeScope } from "@effect/io/Scope"

export type ScopedFork = <R2, E2, B>(
  effect: Effect<R2, E2, B>,
) => Effect<R2, never, RuntimeFiber<E2, B>>

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork) => Effect<R, E, A>,
) {
  return acquireUseRelease(
    makeScope(),
    (scope) => f(forkIn(scope)),
    (scope, exit) => close(scope, exit),
  )
}

export type ForkFxFiber = <R2>(
  effect: Effect<R2, never, void>,
) => Effect<R2, never, RuntimeFiber<never, void>>

export function withUnboundedConcurrency<R, E, A>(
  f: (fork: ForkFxFiber) => Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    gen(function* ($) {
      const fibers = new Set<RuntimeFiber<never, void>>()

      yield* $(
        f((effect) =>
          gen(function* ($) {
            const fiber = yield* $(fork(effect))

            fibers.add(fiber)

            // Ensure that the fiber is removed from the set when it finishes
            yield* $(
              join(fiber),
              ensuring(sync(() => fibers.delete(fiber))),
              // but don't allow this to be blocking
              fork,
            )

            return fiber
          }),
        ),
      )

      // Wait for all fibers to complete
      if (fibers.size > 0) {
        yield* $(joinAll(fibers))
      }
    }),
  )
}

export type ForkFx = <R2>(
  eff: Effect<R2, never, void>,
) => Effect<R2, never, void>

export function withSwitch<R, E, A>(
  f: (switchFork: ForkFx) => Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    gen(function* ($) {
      const ref = yield* $(makeSynchronized<Fiber<never, void>>(unit()))

      const switchFork = <R2>(eff: Effect<R2, never, void>) =>
        updateEffect(ref, (currentFiber) =>
          pipe(
            interruptFork(currentFiber),
            flatMap(() => fork(eff)),
          ),
        )

      yield* $(f(switchFork))

      const fiber = yield* $(get(ref))

      // Wait for last fiber to complete
      if (fiber) {
        yield* $(join(fiber))
      }
    }),
  )
}

export function withExhaust<R, E, A>(
  f: (exhaustFork: ForkFx) => Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    gen(function* ($) {
      const ref = yield* $(makeRef<Fiber<never, void> | void>(undefined))
      const reset = set(ref, undefined)

      const exhaustFork = <R2>(eff: Effect<R2, never, void>) =>
        gen(function* ($) {
          const currentFiber = yield* $(get(ref))

          if (currentFiber) {
            return
          }

          const fiber = yield* $(eff, ensuring(reset), fork)

          yield* $(set(ref, fiber))
        })

      yield* $(f(exhaustFork))

      const fiber = yield* $(get(ref))

      // Wait for last fiber to complete
      if (fiber) {
        yield* $(join(fiber))
      }
    }),
  )
}

export function withExhaustLatest<R, E, A>(
  f: (exhaustLatestFork: ForkFx) => Effect<R, E, A>,
) {
  return withScopedFork((fork) =>
    gen(function* ($) {
      const ref = yield* $(makeRef<Fiber<never, void> | void>(undefined))
      const nextEffect = yield* $(
        makeRef<Option<Effect<any, never, void>>>(none()),
      )
      const reset = set(ref, undefined)

      // Wait for the current fiber to finish
      const awaitNext = gen(function* ($) {
        // Wait for the last fiber to finish
        const fiber = yield* $(get(ref))

        if (fiber) {
          // Wait for the fiber to end to check to see if we need to run another
          yield* $(join(fiber))
        }
      })

      // Run the next value that's be saved for replay if it exists
      const runNext: Effect<any, never, void> = gen(function* ($) {
        const next = yield* $(get(nextEffect))

        if (isSome(next)) {
          // Clear the next A to be replayed
          yield* $(set(nextEffect, none()))

          // Replay the next A
          yield* $(exhaustLatestFork(next.value))

          // Ensure we don't close the scope until the last fiber completes
          yield* $(awaitNext)
        }
      })

      const exhaustLatestFork = <R2>(eff: Effect<R2, never, void>) =>
        gen(function* ($) {
          const currentFiber = yield* $(get(ref))

          if (currentFiber) {
            return yield* $(set(nextEffect, some(eff)))
          }

          const fiber = yield* $(eff, ensuring(zip(reset, runNext)), fork)

          yield* $(set(ref, fiber))
        })

      yield* $(f(exhaustLatestFork))

      // Wait for last fibers to complete
      yield* $(awaitNext)
    }),
  )
}
