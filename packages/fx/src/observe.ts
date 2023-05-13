import { dualWithTrace } from "@effect/data/Debug"
import type { Cause } from "@effect/io/Cause"
import { await as wait, failCause, make, succeed } from "@effect/io/Deferred"
import type { Effect } from "@effect/io/Effect"
import {
  catchAllCause,
  flatMap,
  forEachDiscard,
  fork as forkEffect,
  forkDaemon as forkEffectDaemon,
  forkIn as forkInEffect,
  forkScoped as forkEffectScoped,
  gen,
  sync,
  unit,
} from "@effect/io/Effect"
import type { RuntimeFiber } from "@effect/io/Fiber"
import { interruptFork } from "@effect/io/Fiber"
import type { Scope } from "@effect/io/Scope"
import { Empty } from "@typed/fx/empty"
import { FromArray } from "@typed/fx/fromArray"
import { FromEffect } from "@typed/fx/fromEffect"
import { FromIterable } from "@typed/fx/fromIterable"

import type { Fx } from "./Fx"
import { Sink } from "./Fx"

export const observe: {
  <A, R2, E2>(f: (a: A) => Effect<R2, E2, void>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Effect<R | R2 | Scope, E | E2, void>

  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect<R2, E2, void>): Effect<
    R | R2 | Scope,
    E | E2,
    void
  >
} = dualWithTrace(
  2,
  (trace) =>
    function observe<R, E, A, R2, E2>(
      fx: Fx<R, E, A>,
      f: (a: A) => Effect<R2, E2, void>,
    ): Effect<R | R2 | Scope, E | E2, void> {
      if (fx.instanceof(Empty)) {
        return unit()
      } else if (fx.instanceof(FromEffect)) {
        return flatMap(fx.effect as Effect<R, E, A>, f).traced(fx.trace)
      } else if (fx.instanceof(FromArray) || fx.instanceof(FromIterable)) {
        return forEachDiscard(fx.iterable as Iterable<A>, f).traced(fx.trace)
      } else {
        return gen(function* ($) {
          const deferred = yield* $(make<E | E2, void>())
          const error = (cause: Cause<E | E2>) => failCause(deferred, cause)
          const end = () => succeed(deferred, undefined)

          const fiber = yield* $(
            forkEffectScoped(
              flatMap(
                fx.run(Sink((a: A) => catchAllCause(f(a), error), error)),
                end,
              ),
            ),
          )

          yield* $(wait(deferred))
          yield* $(interruptFork(fiber))
        }).traced(trace)
      }
    },
)

export const observeSync: {
  <A>(f: (a: A) => void): <R, E>(fx: Fx<R, E, A>) => Effect<R | Scope, E, void>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => void): Effect<R | Scope, E, void>
} = dualWithTrace(
  2,
  (trace) =>
    function observeSync<R, E, A>(fx: Fx<R, E, A>, f: (a: A) => void) {
      return observe(fx, (a) => sync(() => f(a))).traced(trace)
    },
)

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect<R | Scope, E, void> {
  return observe(fx, unit as any)
}

export function fork<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, never, RuntimeFiber<E, void>> {
  return forkEffect(drain(fx))
}

export function forkScoped<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, never, RuntimeFiber<E, void>> {
  return forkEffectScoped(drain(fx))
}

export function forkDaemon<R, E, A>(
  fx: Fx<R, E, A>,
): Effect<R | Scope, never, RuntimeFiber<E, void>> {
  return forkEffectDaemon(drain(fx))
}

export const forkIn: {
  (scope: Scope): <R, E, A>(
    fx: Fx<R, E, A>,
  ) => Effect<R | Scope, never, RuntimeFiber<E, void>>

  <R, E, A>(fx: Fx<R, E, A>, scope: Scope): Effect<
    R | Scope,
    never,
    RuntimeFiber<E, void>
  >
} = dualWithTrace(
  2,
  (trace) =>
    function forkIn<R, E, A>(
      fx: Fx<R, E, A>,
      scope: Scope,
    ): Effect<R | Scope, never, void> {
      return forkInEffect(drain(fx), scope).traced(trace)
    },
)
