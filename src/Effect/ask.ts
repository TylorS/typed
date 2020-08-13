import { Arity1 } from '@typed/fp/common'
import { flow } from 'fp-ts/es6/function'
import { Effect, sync } from './Effect'
import { fromEnv } from './fromEnv'

export const ask = <E>(): Effect<E, E> => fromEnv(sync)
export const asks = <E, A>(f: Arity1<E, A>): Effect<E, A> => fromEnv(flow(f, sync))
