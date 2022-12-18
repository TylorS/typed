import * as Effect from '@effect/io/Effect'
import { RuntimeFiber } from '@effect/io/Fiber'
import { FiberRefs } from '@effect/io/FiberRefs'
import { Scope } from '@effect/io/Scope'
import { flow } from '@fp-ts/data/Function'

export function withFiberRefs(refs: FiberRefs) {
  return <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R, E, A> =>
    Effect.gen(function* ($) {
      const current = yield* $(Effect.getFiberRefs())

      yield* $(Effect.setFiberRefs(refs))

      const a = yield* $(effect)

      yield* $(Effect.setFiberRefs(current))

      return a
    })
}

export function forkWithFiberRefs(
  refs: FiberRefs,
): <R, E, A>(
  effect: Effect.Effect<R, E, A>,
) => Effect.Effect<R | Scope, never, RuntimeFiber<E, A>> {
  return flow(withFiberRefs(refs), Effect.forkScoped)
}
