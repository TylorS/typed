import {
  Apply,
  Env,
  GetRequirements as GetEnvRequirements,
  MonadRec,
  URI as EnvURI,
} from '@typed/fp/Env'
import { Fx, map as map_, pure } from '@typed/fp/Fx'
import * as FxT from '@typed/fp/FxT'
import { Arity1 } from '@typed/fp/lambda'
import { Widen, WidenI } from '@typed/fp/Widen'
import { Either } from 'fp-ts/dist/Either'
import { A } from 'ts-toolbelt'

/**
 * Eff is the Env monad lifted into Fx/generators for a do-like notation.
 * This leads to a powerful abstraction in which its very natural to ask for external resources,
 * perform dependency injection, and perform synchronous or asynchronous effects.
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

/**
 * Extract the resources that are required to run a given Eff
 */
export type GetRequirements<A> = A extends (...args: any) => Eff<infer R, any>
  ? R
  : A extends Eff<infer R, any>
  ? WidenI<R>
  : never

/**
 * Extract the result value from an Eff
 */
export type GetResult<A> = A extends Eff<any, infer R> ? R : never

type IsNever<A> = A.Equals<[never], [A]> extends 1 ? true : false

export const of = pure

export const ap = FxT.ap({ ...MonadRec, ...Apply })

export const map: <A, B>(f: Arity1<A, B>) => <E>(fa: Eff<E, A>) => Eff<E, B> = map_

export const chain: <A, E1, B>(
  f: Arity1<A, Eff<E1, B>>,
) => <E2>(fa: Eff<E2, A>) => Eff<WidenI<E1 | E2>, B> = FxT.chain<EnvURI>(MonadRec)

export const chainRec: <A, E1, B>(
  f: Arity1<A, Eff<E1, Either<A, B>>>,
) => (A: A) => Eff<E1, B> = FxT.chainRec(MonadRec)

export const fromEnv: <E, A>(env: Env<E, A>) => Eff<E, A> = FxT.liftFx<EnvURI>()

export const toEnv: <E, A>(env: Eff<E, A>) => Env<E, A> = FxT.toMonad<EnvURI>(MonadRec)

export const doEnv = FxT.getDo<EnvURI>() as <Effects extends Env<never, any>, R, N = unknown>(
  f: (lift: FxT.LiftFx<EnvURI>) => Generator<Effects, R, N>,
) => Eff<WidenI<GetEnvRequirements<Effects>>, R>
