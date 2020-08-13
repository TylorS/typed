import { Arity1, NoInfer } from '@typed/fp/common'
import { Disposable, disposeNone } from '@typed/fp/Disposable'
import { curry } from '@typed/fp/lambda'
import { pipe } from 'fp-ts/es6/pipeable'
import { Effect, Pure } from './Effect'
import { provide } from './provide'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

export const runPure = curry(__runPure) as {
  <A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable
  <A>(onReturn: Arity1<A, Disposable>): (effect: Pure<A>) => Disposable
}

export const execPure = runPure<any>(disposeNone)

export const runEffect = curry(__runEffect) as {
  <A, E>(onReturn: Arity1<A, Disposable>, env: NoInfer<E>, effect: Effect<E, A>): Disposable
  <A, E>(onReturn: Arity1<A, Disposable>, env: NoInfer<E>): (effect: Effect<E, A>) => Disposable
  <A>(onReturn: Arity1<A, Disposable>): {
    <E>(env: NoInfer<E>, effect: Effect<E, A>): Disposable
    <E>(env: E): (effect: Effect<E, A>) => Disposable
  }
}

export const execEffect = runEffect<any>(disposeNone)

function __runEffect<A, E>(
  onReturn: Arity1<A, Disposable>,
  env: NoInfer<E>,
  effect: Effect<E, A>,
): Disposable {
  return pipe(effect, provide(env), runPure(onReturn))
}

function __runPure<A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable {
  return runResume(toEnv(effect)({}), onReturn)
}
