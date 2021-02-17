import {
  Apply,
  EnvEither,
  GetLeft as GetLeft_,
  GetRequirements as GetRequirements_,
  MonadRec,
  URI as EnvEitherURI,
} from '@typed/fp/EnvEither'
import { Fx, map as map_, pure } from '@typed/fp/Fx'
import * as FxT from '@typed/fp/FxT'
import { Arity1 } from '@typed/fp/lambda'
import { IsNever, Widen, WideningOptions } from '@typed/fp/Widen'

export interface EffEither<R, E, A>
  extends Fx<IsNever<R> extends true ? never : EnvEither<R, E, unknown>, A> {}

export interface EffEitherWiden extends WideningOptions {
  2: 'union'
  3: 'intersection'
}

/**
 * Extract the resources that are required to run a given EffEither
 */
export type GetRequirements<A> = A extends EffEither<infer R, any, any>
  ? Widen<R, 'intersection'>
  : never

/**
 * Extract the left value from an EffEither
 */
export type GetLeft<A> = A extends EffEither<any, infer R, any> ? R : never

/**
 * Extract the right value from an EffEither
 */
export type GetRight<A> = A extends EffEither<any, any, infer R> ? R : never
export const of = pure

export const ap = FxT.ap<EnvEitherURI, EffEitherWiden>({ ...MonadRec, ...Apply })

export const map: <A, B>(
  f: Arity1<A, B>,
) => <R, E>(fa: EffEither<R, E, A>) => EffEither<R, E, B> = map_

export const chain: <A, R1, E1, B>(
  f: Arity1<A, EffEither<R1, E1, B>>,
) => <R2, E2>(fa: EffEither<R2, E2, A>) => EffEither<R1 & R2, E1 | E2, B> = FxT.chain<EnvEitherURI>(
  MonadRec,
)

export const fromEnvEither: <R, E, A>(
  env: EnvEither<R, E, A>,
) => EffEither<R, E, A> = FxT.liftFx<EnvEitherURI>()

export const toEnvEither: <R, E, A>(
  env: EffEither<R, E, A>,
) => EnvEither<R, E, A> = FxT.toMonad<EnvEitherURI>(MonadRec)

export const doEffEither: <Effects extends EnvEither<any, any, any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<EnvEitherURI>) => Generator<Effects, R, N>,
) => EffEither<
  Widen<GetRequirements_<Effects>, 'intersection'>,
  GetLeft_<Effects>,
  R
> = FxT.getDo<EnvEitherURI>()
