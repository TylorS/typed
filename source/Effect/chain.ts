import { flow } from 'fp-ts/es6/function'
import { pipe } from 'fp-ts/es6/pipeable'
import { Arity1 } from '../common'
import { curry } from '../lambda'
import { Effect } from './Effect'
import { provide } from './provide'
import { runEffect } from './runEffect'

function chainUncurried<A, E1, B, E2>(
  f: Arity1<A, Effect<E1, B>>,
  effect: Effect<E2, A>,
): Effect<E1 & E2, B> {
  return (e) => (cb) => pipe(effect, provide(e), runEffect(flow(f, provide(e), runEffect(cb))))
}

export const chain = curry(chainUncurried) as {
  <A, E1, B, E2>(f: Arity1<A, Effect<E1, B>>, effect: Effect<E2, A>): Effect<E1 & E2, B>
  <A, E1, B>(f: Arity1<A, Effect<E1, B>>): <E2>(effect: Effect<E2, A>) => Effect<E1 & E2, B>
}
