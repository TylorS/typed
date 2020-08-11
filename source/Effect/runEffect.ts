import { Arity1 } from '@typed/fp/common'
import { Disposable, disposeNone } from '@typed/fp/Disposable'
import { curry } from '@typed/fp/lambda'
import { pipe } from 'fp-ts/es6/pipeable'
import { Effect, Pure } from './Effect'
import { provide } from './provide'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

function __runPure<A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable {
  return runResume(toEnv(effect)({}), onReturn)
}

export const runPure = curry(__runPure) as {
  <A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable
  <A>(onReturn: Arity1<A, Disposable>): (effect: Pure<A>) => Disposable
}

export function runEffect<E, A>(effect: Effect<E, A>, env: E) {
  return pipe(effect, provide(env), runPure(disposeNone))
}
