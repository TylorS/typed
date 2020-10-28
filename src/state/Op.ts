import { ArgsOf as FnArgs } from '@typed/fp/common/exports'
import { Effect, ReturnOf as EffReturn } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { curry, Fn } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'

import { KeyOf, provideShared, readShared, Shared, SharedEnv, ValueOf } from './Shared'

export type Op<K extends string = string, F extends OpFn = OpFn> = Shared<K, F>
export type OpFn = Fn<readonly any[], Effect<any, any>>

export type ArgsOf<O> = [O] extends [Op<any, infer F>] ? FnArgs<F> : []

export type FnOf<O> = O extends Op<string, infer R> ? R : never

export type ReturnOf<O> = [O] extends [Op<any, infer F>] ? EffReturn<ReturnType<F>> : []

export const createOp = <O extends Op>(key: KeyOf<O>): O => key as O

export const callOp = <O extends Op, E, A>(
  op: O,
  f: (f: FnOf<typeof op>) => Effect<E, A>,
): Effect<E & SharedEnv<typeof op>, A> =>
  doEffect(function* () {
    const call = (yield* readShared(op)) as FnOf<typeof op>

    return yield* f(call)
  })

export const provideOp = curry(
  <O extends Op, E1, E2, A>(
    op: O,
    provider: Effect<E1, FnOf<O>>,
    effect: Effect<E2 & SharedEnv<O>, A>,
  ): Effect<E1 & E2, A> => {
    const eff = doEffect(function* () {
      const call: ValueOf<O> = yield* provider

      return yield* pipe(effect, provideShared<O>(op, call))
    })

    return eff
  },
) as {
  <O extends Op, E1, E2, A>(
    op: O,
    provider: Effect<E1, FnOf<O>>,
    effect: Effect<E2 & SharedEnv<O>, A>,
  ): Effect<E1 & E2, A>

  <O extends Op, E1>(op: O, provider: Effect<E1, FnOf<O>>): <E2, A>(
    effect: Effect<E2 & SharedEnv<O>, A>,
  ) => Effect<E1 & E2, A>

  <O extends Op>(op: O): {
    <E1, E2, A>(provider: Effect<E1, FnOf<O>>, effect: Effect<E2 & SharedEnv<O>, A>): Effect<
      E1 & E2,
      A
    >

    <E1>(provider: Effect<E1, FnOf<O>>): <E2, A>(
      effect: Effect<E2 & SharedEnv<O>, A>,
    ) => Effect<E1 & E2, A>
  }
}
