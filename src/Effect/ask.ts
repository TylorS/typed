import { Arity1 } from '@typed/fp/common'
import { Effect, Pure, sync } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { flow } from 'fp-ts/es6/function'

import { doEffect } from './doEffect'
import { toEnv } from './toEnv'

/**
 * @since 0.0.1
 */
export const ask = <E>(): Effect<E, E> => fromEnv(sync)

/**
 * @since 0.0.1
 */
export const asks = <E, A>(f: Arity1<E, A>): Effect<E, A> => fromEnv(flow(f, sync))

export const askFor = <E, A>(eff: Effect<E, A>): Effect<E, Pure<A>> =>
  doEffect(function* () {
    const e1 = yield* ask<E>()
    const pure = fromEnv((e2: {}) => toEnv(eff)({ ...e2, ...e1 }))

    return pure
  })
