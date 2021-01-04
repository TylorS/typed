import { Arity1, HeadArg } from '@fp/common/exports'
import { sync } from '@fp/Resume/exports'
import { flow } from 'fp-ts/function'

import { doEffect } from './doEffect'
import { AddEnv, Effect, EffectGenerator, EffectOf, fromEnv, Pure } from './Effect'
import { toEnv } from './toEnv'

/**
 * Ask for a value from the Environment
 */
export const ask = <E = unknown>(): Effect<E, E> => fromEnv(sync)

/**
 * Apply a function to the Environment.
 */
export const asks = <E, A>(f: Arity1<E, A>): Effect<E, A> => fromEnv(flow(f, sync))

/**
 * Ask for the Pure version of an Effect.
 */
export const askFor = <E, A>(eff: Effect<E, A>): Effect<E, Pure<A>> =>
  doEffect(function* () {
    const e1 = yield* ask<E>()
    const pure = fromEnv((e2: unknown) => toEnv(eff)({ ...(e2 as {}), ...e1 }))

    return pure
  })

/**
 * Create an Effect with part of the environment being provided to the provided generator function.
 */
export const doEffectWith = <G extends (env: unknown) => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): AddEnv<HeadArg<G>, EffectOf<G>> =>
  doEffect(function* () {
    const e1 = yield* ask<HeadArg<G>>()

    return yield* effectGeneratorFunction(e1)
  })
