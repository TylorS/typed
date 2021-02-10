import { Fx, LiftFx, Pure, pure } from '@fp/Fx'
import { getRecFxM } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { Apply, Either, URI as EitherURI } from 'fp-ts/dist/Either'
import { pipe } from 'fp-ts/dist/function'

import { MonadRec } from './chainRec'

/**
 * EitherFx is an Either monad lifted into a Fx/generator context for do-like notation
 *
 * @example
 * const fx: EitherFx<E | F, B> = doEither(function* (_) {
 *   const a: A = yield* _(eitherReturningFunction<E, A>())
 *   const b: B = yield* _(eitherReturningFunction2<F, B>(a))
 *
 *   return B
 * })
 */
export interface EitherFx<E, A> extends Fx<Either<E, unknown>, A> {}

export type GetRequirements<A> = A extends EitherFx<infer R, any> ? R : never

export type GetResult<A> = A extends EitherFx<any, infer R> ? R : never

const eitherFxM = getRecFxM<EitherURI>({ ...MonadRec, ...Apply })

export const of = <A>(value: A): Pure<A> => pure(value)

export const ap = <E1, A>(fa: EitherFx<E1, A>) => <E2, B>(
  fab: EitherFx<E2, Arity1<A, B>>,
): EitherFx<E1 | E2, B> => pipe(fab, eitherFxM.ap(fa))

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: EitherFx<E, A>) => EitherFx<E, B> =
  eitherFxM.map

export const chain: <A, E1, B>(
  f: Arity1<A, EitherFx<E1, B>>,
) => <E2>(fa: EitherFx<E2, A>) => EitherFx<E1 | E2, B> = eitherFxM.chain

export const fromEither: <E, A>(hkt: Either<E, A>) => EitherFx<E, A> = eitherFxM.fromMonad

export const toEither: <E, A>(EitherFx: EitherFx<E, A>) => Either<E, A> = eitherFxM.toMonad

export const doEither: <EitherFxs extends Either<any, any>, R, N = unknown>(
  f: (lift: LiftFx<EitherURI>) => Generator<EitherFxs, R, N>,
) => EitherFx<GetEitherLeft<EitherFxs>, R> = eitherFxM.doMonad

export type GetEitherLeft<A> = [A] extends [Either<infer E, any>] ? E : never

export type GetEitherRight<A> = [A] extends [Either<any, infer R>] ? R : never
