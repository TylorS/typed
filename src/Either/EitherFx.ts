import { Fx, map as map_, pure } from '@fp/Fx'
import * as FxT from '@fp/FxT'
import { getDo } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { Apply, Either, URI as EitherURI } from 'fp-ts/dist/Either'

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

export const of = pure

export const ap: <E1, A>(
  fa: EitherFx<E1, A>,
) => <E2, B>(fab: EitherFx<E2, Arity1<A, B>>) => EitherFx<E1 | E2, B> = FxT.ap({
  ...MonadRec,
  ...Apply,
})

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: EitherFx<E, A>) => EitherFx<E, B> = map_

export const chain: <A, E1, B>(
  f: Arity1<A, EitherFx<E1, B>>,
) => <E2>(fa: EitherFx<E2, A>) => EitherFx<E1 | E2, B> = FxT.chain<EitherURI>()

export const fromEither = FxT.liftFx<EitherURI>()
export const toEither: <E, A>(fx: EitherFx<E, A>) => Either<E, A> = FxT.toMonad(MonadRec)
export const doEither = getDo<EitherURI>()
