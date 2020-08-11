import { Effect, Env } from './Effect'

export function fromEnv<E, A>(env: Env<E, A>): Effect<E, A> {
  return {
    *[Symbol.iterator]() {
      const a = yield env

      return a as A
    },
  }
}
