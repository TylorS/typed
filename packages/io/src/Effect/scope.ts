import { RuntimeFiber } from '../Fiber/Fiber.js'
import { Scope } from '../Scope.js'

import { Effect } from './Effect.js'
import { gen } from './Instruction.js'
import { ask, asksEffect, context, getFiberId, lazy, uninterruptable, unit } from './operators.js'

export function managed<R, E, A, R2>(
  acquire: Effect<R, E, A>,
  release: (a: A) => Effect<R2, never, unknown>,
): Effect<R | R2 | Scope, E, A> {
  return uninterruptable(
    gen(function* () {
      const env = yield* context<R2>()
      const scope: Scope = yield* ask(Scope)
      const a = yield* acquire

      yield* scope.addFinalizer(() => release(a).provideContext(env))

      return a
    }),
  )
}

export function forkScope(__trace?: string): Effect.RIO<Scope, Scope> {
  return asksEffect(Scope, (s) => s.fork, __trace)
}

export function scoped<R, E, A>(
  effect: Effect<R | Scope, E, A>,
  __trace?: string,
): Effect<Exclude<R, Scope>, E, A> {
  return lazy(() => {
    const scope = Scope()

    return effect.provideService(Scope, scope).ensuring(scope.close)
  }, __trace)
}

export function forkScoped<R, E, A>(
  effect: Effect<R | Scope, E, A>,
  __trace?: string,
): Effect<R | Scope, never, RuntimeFiber<E, A>> {
  return forkScope()
    .flatMap((scope) => getFiberId.map((id) => [scope, id] as const))
    .flatMap(
      ([scope, id]) =>
        effect
          .provideService(Scope, scope)
          .ensuring(scope.close)
          .forkDaemon()
          .tap((fiber) =>
            scope.addFinalizer(() =>
              getFiberId.flatMap(
                (childId): Effect.Of<unknown> => (childId === id ? unit : fiber.interruptAs(id)),
              ),
            ),
          ),
      __trace,
    )
}
