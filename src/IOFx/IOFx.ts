import { Fx, map as map_, pure } from '@typed/fp/Fx'
import * as FxT from '@typed/fp/FxT'
import { MonadRec } from '@typed/fp/IO/MonadRec'
import { Arity1 } from '@typed/fp/lambda'
import { Apply, IO, URI as IoURI } from 'fp-ts/dist/IO'

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
export interface IoFx<A> extends Fx<IO<unknown>, A> {}

export type GetResult<A> = A extends IoFx<infer R> ? R : never

export const of = pure

export const ap = FxT.ap({ ...MonadRec, ...Apply })

export const map: <A, B>(f: Arity1<A, B>) => (fa: IoFx<A>) => IoFx<B> = map_

export const chain: <A, B>(f: Arity1<A, IoFx<B>>) => (fa: IoFx<A>) => IoFx<B> = FxT.chain<IoURI>(
  MonadRec,
)

export const fromIO: <A>(io: IO<A>) => IoFx<A> = FxT.liftFx<IoURI>()

export const toIO: <A>(fx: IoFx<A>) => IO<A> = FxT.toMonad(MonadRec)

export const doIO: <Effects extends IO<any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<IoURI>) => Generator<Effects, R, N>,
) => IoFx<R> = FxT.getDo<IoURI>()
