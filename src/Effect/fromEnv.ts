import { Effect, Env } from './Effect'

/**
 * @since 0.0.1
 */
export function fromEnv<E, A>(env: Env<E, A>): Effect<E, A> {
  return {
    *[Symbol.iterator]() {
      const a = yield env

      return a as A
    },
  }
}
