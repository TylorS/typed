import { Arity1 } from '@typed/fp/common'
import { curry } from '@typed/fp/lambda'
import { flow } from 'fp-ts/es6/function'
import { pipe } from 'fp-ts/es6/pipeable'
import { Effect } from './Effect'
import { provide } from './provide'
import { runEffect } from './runEffect'

export const map = curry(__map) as {
  <E, A, B>(f: Arity1<A, B>, effect: Effect<E, A>): Effect<E, B>
  <A, B>(f: Arity1<A, B>): <E>(effect: Effect<E, A>) => Effect<E, B>
}

function __map<E, A, B>(f: Arity1<A, B>, effect: Effect<E, A>): Effect<E, B> {
  return (e) => (cb) => pipe(effect, provide(e), runEffect(flow(f, cb)))
}
