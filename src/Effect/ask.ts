import { Arity1 } from '@typed/fp/common/exports'
import { sync } from '@typed/fp/Resume/exports'
import { flow } from 'fp-ts/function'

import { doEffect } from './doEffect'
import { Effect, Pure } from './Effect'
import { fromEnv } from './fromEnv'
import { toEnv } from './toEnv'

export const ask = <E = unknown>(): Effect<E, E> => fromEnv(sync)

export const asks = <E, A>(f: Arity1<E, A>): Effect<E, A> => fromEnv(flow(f, sync))

export const askFor = <E, A>(eff: Effect<E, A>): Effect<E, Pure<A>> =>
  doEffect(function* () {
    const e1 = yield* ask<E>()
    const pure = fromEnv((e2: {}) => toEnv(eff)({ ...e2, ...e1 }))

    return pure
  })
