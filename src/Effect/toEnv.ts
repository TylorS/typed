import { chain, Resume, sync } from '@typed/fp/Resume/exports'

import { Effect, EffectGenerator, Env } from './Effect'

/**
 * Converts an Effect<A, A> to and Env<E, A> with a simple stack-safe interpreter.
 */
export const toEnv = <E, A>(effect: Effect<E, A>): Env<E, A> => (e: E) => {
  const generator = effect[Symbol.iterator]()

  return effectGeneratorToResume(generator, generator.next(), e)
}

const effectGeneratorToResume = <E, A>(
  generator: EffectGenerator<E, A>,
  result: IteratorResult<Env<E, unknown>, A>,
  env: E,
): Resume<A> => {
  try {
    while (!result.done) {
      const resume = result.value(env)

      if (resume.async) {
        return chain((a) => effectGeneratorToResume(generator, generator.next(a), env), resume)
      }

      result = generator.next(resume.value)
    }

    return sync(result.value)
  } catch (error) {
    return effectGeneratorToResume(generator, generator.throw(error), env)
  }
}
