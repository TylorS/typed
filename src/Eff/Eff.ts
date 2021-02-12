import { Apply, Env, GetRequirements as GetEnvRequirements, MonadRec, URI as EnvURI } from '@fp/Env'
import { chain as chain_, Fx, map as map_, pure } from '@fp/Fx'
import * as FxT from '@fp/FxT'
import { Arity1 } from '@fp/lambda'
import { Widen } from '@fp/Widen'
import { A } from 'ts-toolbelt'

/**
 * Eff is the Env monad lifted into Fx/generators for a do-like notation.
 *
 * @example
 * const baz: Eff<{a:number}, number> = doEff(function*(_) { ... })
 *
 * const eff: Eff<{a:number} & {foo: string}, string> = doEff(function*(_) {
 *   // "_" can be used to lift Env monads into a generator
 *   const foo: string = yield* _( asks((e: {foo: string} ) => e.foo) )
 *
 *   // Effs can be nested with "yield *", all requirements will be composed as an intersection.
 *   const bar: number = yield* baz
 *
 *   return foo + bar
 * })
 */
export interface Eff<E, A> extends Fx<IsNever<E> extends true ? never : Env<E, unknown>, A> {}

export type GetRequirements<A> = A extends Eff<infer R, any> ? Widen<R, 'intersection'> : never

export type GetResult<A> = A extends Eff<any, infer R> ? R : never

type IsNever<A> = A.Equals<[never], [A]> extends 1 ? true : false

export const of = pure

export const ap = FxT.ap({ ...MonadRec, ...Apply })

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: Eff<E, A>) => Eff<E, B> = map_

export const chain = chain_ as <A, E1, B>(
  f: Arity1<A, Eff<E1, B>>,
) => <E2>(fa: Eff<E2, A>) => Eff<Widen<E1 | E2, 'intersection'>, B>

export const fromEnv: <E, A>(hkt: Env<E, A>) => Eff<E, A> = FxT.liftFx<EnvURI>()

export const toEnv = FxT.toMonad(MonadRec) as <E, A>(
  eff: Eff<E, A>,
) => Env<Widen<E, 'intersection'>, A>

export const doEff: <Effects extends Env<any, any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<EnvURI>) => Generator<Effects, R, N>,
) => Eff<Widen<GetEnvRequirements<Effects>, 'intersection'>, R> = FxT.getDo<EnvURI>()
