import { Scope } from '../Scope.js'

import { Effect } from './Effect.js'
import { gen } from './Instruction.js'
import { ask, asksEffect, context, provide, uninterruptable } from './operators.js'

export function managed<R, E, A, R2>(
  acquire: Effect<R, E, A>,
  release: (a: A) => Effect<R2, never, unknown>,
): Effect<R | R2 | Scope, E, A> {
  return uninterruptable(
    gen(function* () {
      const env = yield* context<R2>()
      const scope = yield* ask(Scope)
      const a = yield* acquire

      yield* scope.addFinalizer(() => provide(env)(release(a)))

      return a
    }),
  )
}

export function forkScope(__trace?: string): Effect.RIO<Scope, Scope> {
  return asksEffect(Scope, (s) => s.fork, __trace)
}
