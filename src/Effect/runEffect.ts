import { Arity1, NoInfer } from '@typed/fp/common/exports'
import { Disposable, disposeNone } from '@typed/fp/Disposable/exports'
import { curry } from '@typed/fp/lambda/exports'
import { run } from '@typed/fp/Resume/exports'
import { pipe } from 'fp-ts/pipeable'

import { Effect, Pure } from './Effect'
import { provideAll } from './provide'
import { toEnv } from './toEnv'

/**
 * Pure will unfortunately swallow environment requirements, so be sure
 * to use in conjunction with useAll/provideAll.
 */
export const runPure = curry(__runPure) as {
  <A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable
  <A>(onReturn: Arity1<A, Disposable>): (effect: Pure<A>) => Disposable
}

/**
 * Pure will unfortunately swallow environment requirements, so be sure
 * to use in conjunction with useAll/provideAll.
 */
export const execPure = runPure(disposeNone)

export const runEffect = curry(__runEffect) as {
  <A, E>(onReturn: Arity1<A, Disposable>, env: NoInfer<E>, effect: Effect<E, A>): Disposable
  <A, E>(onReturn: Arity1<A, Disposable>, env: E): (effect: Effect<E, A>) => Disposable
  <A>(onReturn: Arity1<A, Disposable>): {
    <E>(env: NoInfer<E>, effect: Effect<E, A>): Disposable
    <E>(env: E): (effect: Effect<E, A>) => Disposable
  }
}

/**
 * Execute an Effect without care for the return value.
 */
export const execEffect = runEffect<unknown>(disposeNone)

function __runEffect<A, E>(
  onReturn: Arity1<A, Disposable>,
  env: E,
  effect: Effect<E, A>,
): Disposable {
  return pipe(effect, provideAll(env), runPure(onReturn))
}

function __runPure<A>(onReturn: Arity1<A, Disposable>, effect: Pure<A>): Disposable {
  return run(toEnv(effect)({}), onReturn)
}
