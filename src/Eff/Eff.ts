import { Apply, Env, GetRequirements as GetEnvRequirements, MonadRec, URI as EnvURI } from '@fp/Env'
import { Fx, LiftFx, Pure, pure } from '@fp/Fx'
import { getRecFxM } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { IntersectionWiden, Widen } from '@fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { A } from 'ts-toolbelt'

export interface Eff<E, A> extends Fx<IsNever<E> extends true ? never : Env<E, unknown>, A> {}

export type GetRequirements<A> = A extends Eff<infer R, any> ? Widen<R, 'intersection'> : never
export type GetResult<A> = A extends Eff<any, infer R> ? R : never

type IsNever<A> = A.Equals<[never], [A]> extends 1 ? true : false

const effM = getRecFxM<EnvURI, IntersectionWiden>({ ...MonadRec, ...Apply })

export const of = <A>(value: A): Pure<A> => pure(value)

export const ap = <E1, A>(fa: Eff<E1, A>) => <E2, B>(
  fab: Eff<E2, Arity1<A, B>>,
): Eff<Widen<E1 | E2, 'intersection'>, B> => pipe(fab, effM.ap(fa))

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: Eff<E, A>) => Eff<E, B> = effM.map

export const chain: <A, E1, B>(
  f: Arity1<A, Eff<E1, B>>,
) => <E2>(fa: Eff<E2, A>) => Eff<Widen<E1 | E2, 'intersection'>, B> = effM.chain

export const fromEnv: <E, A>(hkt: Env<E, A>) => Eff<E, A> = effM.fromMonad

export const toEnv: <E, A>(eff: Eff<E, A>) => Env<Widen<E, 'intersection'>, A> = effM.toMonad

export const doEff: <Effects extends Env<any, any>, R, N = unknown>(
  f: (lift: LiftFx<EnvURI>) => Generator<Effects, R, N>,
) => Eff<Widen<GetEnvRequirements<Effects>, 'intersection'>, R> = effM.doMonad
