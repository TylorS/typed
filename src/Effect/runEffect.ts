import { Arity1, NoInfer } from '@typed/fp/common'
import { Disposable, disposeNone } from '@typed/fp/Disposable'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { provide } from '@typed/fp/Effect/provide'
import { runResume } from '@typed/fp/Effect/runResume'
import { toEnv } from '@typed/fp/Effect/toEnv'
import { curry } from '@typed/fp/lambda'
import { pipe } from 'fp-ts/es6/pipeable'

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
