import { Fx, map as map_, pure } from '@fp/Fx'
import * as FxT from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { Apply, IO, URI as IoURI } from 'fp-ts/dist/IO'

import { MonadRec } from './chainRec'

/**
 * IOFx is an Either monad lifted into a Fx/generator context for do-like notation
 *
 * @example
 * const fx: IOFx<E | F, B> = doEither(function* (_) {
 *   const a: A = yield* _(eitherReturningFunction<E, A>())
 *   const b: B = yield* _(eitherReturningFunction2<F, B>(a))
 *
 *   return B
 * })
 */
export interface IOFx<A> extends Fx<IO<unknown>, A> {}

export type GetResult<A> = A extends IOFx<infer R> ? R : never

export const of = pure

export const ap = FxT.ap({ ...MonadRec, ...Apply })

export const map: <A, B>(f: Arity1<A, B>) => (fa: IOFx<A>) => IOFx<B> = map_

export const chain: <A, B>(f: Arity1<A, IOFx<B>>) => (fa: IOFx<A>) => IOFx<B> = FxT.chain<IoURI>()

export const fromIO: <A>(io: IO<A>) => IOFx<A> = FxT.liftFx<IoURI>()

export const toIO: <A>(fx: IOFx<A>) => IO<A> = FxT.toMonad(MonadRec)

export const doIO: <Effects extends IO<any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<IoURI>) => Generator<Effects, R, N>,
) => IOFx<R> = FxT.getDo<IoURI>()
