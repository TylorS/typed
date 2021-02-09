import { Apply, Env, MonadRec, URI as EnvURI } from '@fp/Env'
import { Fx, LiftFx } from '@fp/Fx'
import { getRecFxM } from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { IntersectionWiden, Widen } from '@fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { A, U } from 'ts-toolbelt'

export interface Eff<E, A> extends Fx<EnvsOf<E>, A> {}

export type EnvsOf<E> = A.Equals<[never], [E]> extends 1
  ? never
  : { [K in keyof U.ListOf<E>]: Env<U.ListOf<E>[K], unknown> }[number]

const effM = getRecFxM<EnvURI, IntersectionWiden>({ ...MonadRec, ...Apply })

export const of = <A>(value: A): Eff<never, A> => effM.of(value)

export const ap = <E1, A>(fa: Eff<E1, A>) => <E2, B>(fab: Eff<E2, Arity1<A, B>>): Eff<E1 | E2, B> =>
  pipe(fab, effM.ap(fa))

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: Eff<E, A>) => Eff<E, B> = effM.map

export const chain: <A, E1, B>(
  f: Arity1<A, Eff<E1, B>>,
) => <E2>(fa: Eff<E2, A>) => Eff<E1 | E2, B> = effM.chain

export const fromEnv: <E, A>(hkt: Env<E, A>) => Eff<E, A> = effM.fromMonad
export const toEnv = effM.toMonad as <E, A>(eff: Eff<E, A>) => Env<Widen<E, 'intersection'>, A>

export const doEnv: <Y extends Env<any, any>, R, N = unknown>(
  f: (lift: LiftFx<EnvURI>) => Generator<Y, R, N>,
) => Eff<StripEnvs<Y>, R> = effM.doMonad

export type StripEnvs<T extends Env<any, any>> = {
  [K in keyof U.ListOf<T>]: U.ListOf<T>[K] extends Env<infer R, any> ? R : never
}[number]
