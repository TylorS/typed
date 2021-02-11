import { Fx, LiftFx, Pure, pure } from '@fp/Fx'
import { getRecFxM } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { pipe } from 'fp-ts/dist/function'
import { Apply, IO, URI as EitherURI } from 'fp-ts/dist/IO'

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

const eitherFxM = getRecFxM<EitherURI>({ ...MonadRec, ...Apply })

export const of = <A>(value: A): Pure<A> => pure(value)

export const ap = <A>(fa: IOFx<A>) => <B>(fab: IOFx<Arity1<A, B>>): IOFx<B> =>
  pipe(fab, eitherFxM.ap(fa))

export const map: <A, B>(f: Arity1<A, B>) => (fa: IOFx<A>) => IOFx<B> = eitherFxM.map

export const chain: <A, B>(f: Arity1<A, IOFx<B>>) => (fa: IOFx<A>) => IOFx<B> = eitherFxM.chain

export const fromIO: <A>(io: IO<A>) => IOFx<A> = eitherFxM.fromMonad

export const toIO: <A>(IOFx: IOFx<A>) => IO<A> = eitherFxM.toMonad

export const doIO: <IOFxs extends IO<any>, R, N = unknown>(
  f: (lift: LiftFx<EitherURI>) => Generator<IOFxs, R, N>,
) => IOFx<R> = eitherFxM.doMonad

export type GetIOValue<A> = [A] extends [IO<infer E>] ? E : never
