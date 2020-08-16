import { Arity1 } from '@typed/fp/common'
import { Effect, sync } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { flow } from 'fp-ts/es6/function'

/**
 * @since 0.0.1
 */
export const ask = <E>(): Effect<E, E> => fromEnv(sync)

/**
 * @since 0.0.1
 */
export const asks = <E, A>(f: Arity1<E, A>): Effect<E, A> => fromEnv(flow(f, sync))
