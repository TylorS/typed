import { Arity1, NoInfer } from '@typed/fp/common/exports'
import { Disposable, disposeNone } from '@typed/fp/Disposable/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/pipeable'

import { Effect, Pure } from './Effect'
import { provide } from './provide'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

/**
 * @since 0.0.1
 */
export const runPure = curry(__runPure) as {
  <A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable
  <A>(onReturn: Arity1<A, Disposable>): (effect: Pure<A>) => Disposable
}

/**
 * @since 0.0.1
 */
export const execPure = runPure<any>(disposeNone)

/**
 * @since 0.0.1
 */
export const runEffect = curry(__runEffect) as {
  <A, E>(onReturn: Arity1<A, Disposable>, env: NoInfer<E>, effect: Effect<E, A>): Disposable
  <A, E>(onReturn: Arity1<A, Disposable>, env: E): (effect: Effect<E, A>) => Disposable
  <A>(onReturn: Arity1<A, Disposable>): {
    <E>(env: NoInfer<E>, effect: Effect<E, A>): Disposable
    <E>(env: E): (effect: Effect<E, A>) => Disposable
  }
}

/**
 * @since 0.0.1
 */
export const execEffect = runEffect<any>(disposeNone)

function __runEffect<A, E>(
  onReturn: Arity1<A, Disposable>,
  env: E,
  effect: Effect<E, A>,
): Disposable {
  return pipe(effect, provide(env), runPure(onReturn))
}

function __runPure<A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable {
  return runResume(toEnv(effect)({}), onReturn)
}
