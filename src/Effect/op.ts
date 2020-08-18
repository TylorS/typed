import { ask, asks } from '@typed/fp/Effect/ask'
import { doEffect } from '@typed/fp/Effect/doEffect'
import { Effect } from '@typed/fp/Effect/Effect'
import { use } from '@typed/fp/Effect/provide'
import { pipe } from 'fp-ts/lib/pipeable'
import { iso, Newtype } from 'newtype-ts'

export interface Computation<
  K = any,
  Args extends ReadonlyArray<any> = ReadonlyArray<any>,
  R = any
> extends Newtype<{ readonly Op: unique symbol; readonly args: Args; readonly return: R }, K> {}

export interface Op<K = any, R = any> extends Computation<K, ReadonlyArray<never>, R> {}

export type OpKey<A> = A extends Computation<infer R, any, any> ? R : never
export type OpArgs<A> = A extends Computation<any, infer R, any> ? R : never
export type OpValue<A> = A extends Computation<any, any, infer R> ? R : never

export const OP = Symbol.for('@typed/fp/Op')
export type OP = typeof OP

export interface OpEnv<C extends Computation>
  extends Newtype<
    C,
    {
      readonly [OP]: Map<Computation, GetComputation<any, Computation>>
    }
  > {}

export type GetComputation<E, C extends Computation> = (...args: OpArgs<C>) => Effect<E, OpValue<C>>

const computationIso = iso<Computation<any, any, any>>()
const computationEnvIso = iso<OpEnv<any>>()
const emptyOpEnv = (): OpEnv<any> => computationEnvIso.wrap({ [OP]: new Map() })
const EMPTY_ARGS: readonly any[] = []

export function createOp<A>() {
  return function <K>(key: K): Op<K, A> {
    return computationIso.wrap(key)
  }
}

export function createComputation<Args extends ReadonlyArray<any>, A>() {
  return function <K>(key: K): Computation<K, Args, A> {
    return computationIso.wrap(key)
  }
}

export function provideComputation<C extends Computation, E>(
  key: C,
  computation: GetComputation<E, C>,
) {
  return <F, A>(eff: Effect<F & OpEnv<C>, A>): Effect<E & F, A> => {
    const effect = doEffect(function* () {
      // Since OpEnv is opaque and uses the Op as a key to it's map, it could already be provided
      const env = yield* ask<Partial<OpEnv<any>>>()
      const opEnv = isOpEnv(env) ? env : emptyOpEnv()

      computationEnvIso.unwrap(opEnv)[OP].set(key, computation)

      const value = yield* pipe(eff, use(opEnv))

      return value
    })

    return (effect as unknown) as Effect<E & F, A>
  }
}

export function useComputation<C extends Computation>(
  key: C,
  ...args: OpArgs<C>
): Effect<OpEnv<C>, OpValue<C>> {
  return doEffect(function* () {
    const { [OP]: map } = yield* asks(computationEnvIso.unwrap)
    const computation = map.get(key)! as GetComputation<unknown, C>
    const value = yield* computation(...args)

    return value
  })
}

export function useOp<O extends Op>(key: O): Effect<OpEnv<O>, OpValue<O>> {
  return useComputation<O>(key, ...(EMPTY_ARGS as OpArgs<O>))
}

export function provideOp<O extends Op, E>(
  key: O,
  effect: Effect<E, OpValue<O>>,
): <F, A>(eff: Effect<F & OpEnv<O>, A>) => Effect<E & F, A> {
  return provideComputation<O, E>(key, () => effect)
}

function isOpEnv(env: Partial<OpEnv<any>>): env is OpEnv<any> {
  return OP in env
}
