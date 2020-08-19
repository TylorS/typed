import { ask, asks } from '@typed/fp/Effect/ask'
import { doEffect } from '@typed/fp/Effect/doEffect'
import { Effect } from '@typed/fp/Effect/Effect'
import { provide } from '@typed/fp/Effect/provide'
import { pipe } from 'fp-ts/lib/pipeable'
import { iso, Newtype } from 'newtype-ts'

/**
 * Used to represent the resources required to perform a particular computation
 */
export interface Op<Key = any, Args extends ReadonlyArray<any> = ReadonlyArray<any>, R = any>
  extends Newtype<OpUri<Args, R>, Key> {}

export interface OpUri<Args extends ReadonlyArray<any> = ReadonlyArray<any>, R = any> {
  readonly Op: unique symbol
  readonly Args: Args
  readonly Return: R
}

export type OpKey<A> = A extends Op<infer R, any, any> ? R : never
export type OpArgs<A> = A extends Op<any, infer R, any> ? R : never
export type OpReturn<A> = A extends Op<any, any, infer R> ? R : never

export const OP = Symbol.for('@typed/fp/Op')
export type OP = typeof OP

export interface OpEnv<C extends Op>
  extends Newtype<
    C,
    {
      readonly [OP]: OpMap
    }
  > {}

export type OpMap = Map<Op<any, any, any>, GetOp<any, Op<any, any, any>>>

export type GetOp<E, C extends Op> = OpArgs<C> extends readonly []
  ? () => Effect<E, OpReturn<C>>
  : (...args: OpArgs<C>) => Effect<E, OpReturn<C>>

const opIso = iso<Op<any, any, any>>()
const opEnvIso = iso<OpEnv<any>>()
const emptyOpEnv = (): OpEnv<any> => opEnvIso.wrap({ [OP]: new Map() })

export function createOp<A extends Op>(key: OpKey<A>): A {
  return opIso.wrap(key) as A
}

export function provideOp<O extends Op, E>(Op: O, computation: GetOp<E, O>) {
  return <F, A>(eff: Effect<F & OpEnv<O>, A>): Effect<E & F, A> => {
    const effect = doEffect(function* () {
      // Since OpEnv is opaque and uses the Op as a key to it's map, it could already be provided
      const env = yield* ask<Partial<OpEnv<any>>>()
      const opEnv = isOpEnv(env) ? env : emptyOpEnv()

      opEnvIso.unwrap(opEnv)[OP].set(Op, computation)

      const value = yield* pipe(eff, provide(opEnv))

      return value
    })

    return (effect as unknown) as Effect<E & F, A>
  }
}

export function useOp<O extends Op>(Op: O) {
  return (...args: OpArgs<O>): Effect<OpEnv<O>, OpReturn<O>> => {
    return doEffect(function* () {
      const { [OP]: map } = yield* asks(opEnvIso.unwrap)
      const computation = map.get(Op)! as GetOp<unknown, O>
      const value = yield* computation(...args)

      return value
    })
  }
}

function isOpEnv(env: Partial<OpEnv<any>>): env is OpEnv<any> {
  return OP in env
}
