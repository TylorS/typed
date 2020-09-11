import { And, TupleKeys } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf, ReturnOf } from '@typed/fp/Effect/exports'
import { GetOperation, Op, OpEnv, provideOp } from '@typed/fp/Op/exports'
import { pipe } from 'fp-ts/pipeable'
import { mapWithIndex, reduce } from 'fp-ts/ReadonlyArray'

import { useOp } from './provideOp'

/**
 * Allows providing multiple operations together which may require shared state, resources, or
 * simply for convenience.
 */
export function provideOpGroup<OPS extends ReadonlyArray<Op<any, any>>, G extends OpGroup<OPS>>(
  ops: OPS,
  opGroup: G,
) {
  const provided = new WeakMap<Effect<any, any>, Effect<any, any>>()

  return <E, A>(effect: Effect<E & OpEnvs<OPS>, A>): Effect<E & OpGroupEnv<G>, A> => {
    const eff = doEffect(function* () {
      if (!provided.has(effect)) {
        const effects = yield* opGroup

        provided.set(
          effect,
          pipe(
            ops,
            mapWithIndex((i, op) => provideOp(op, effects[i])),
            reduce(effect, (fx, provide) => provide(fx)),
          ),
        )
      }

      return yield* provided.get(effect)!
    })

    return (eff as unknown) as Effect<E & OpGroupEnv<G>, A>
  }
}

export function useOpGroup<OPS extends ReadonlyArray<Op<any, any>>, G extends OpGroup<OPS>>(
  ops: OPS,
  opGroup: G,
) {
  const provided = new WeakMap<Effect<any, any>, Effect<any, any>>()

  return <E, A>(effect: Effect<E & OpEnvs<OPS>, A>): Effect<E & OpGroupEnv<G>, A> => {
    const eff = doEffect(function* () {
      if (!provided.has(effect)) {
        const effects = yield* opGroup

        provided.set(
          effect,
          pipe(
            ops,
            mapWithIndex((i, op) => useOp(op, effects[i])),
            reduce(effect, (fx, use) => use(fx)),
          ),
        )
      }

      return yield* provided.get(effect)!
    })

    return (eff as unknown) as Effect<E & OpGroupEnv<G>, A>
  }
}

export type OpEnvs<OPS extends ReadonlyArray<Op<any, any>>> = And<
  {
    [K in keyof OPS]: OPS[K] extends Op<any, any> ? OpEnv<OPS[K]> : never
  }
>

export type OpGroup<OPS extends ReadonlyArray<Op<any, any>> = ReadonlyArray<Op<any, any>>> = Effect<
  any,
  OpGroupEffects<OPS>
>

export type OpGroupEffects<OPS extends ReadonlyArray<Op<any, any>>> = {
  readonly [K in keyof OPS]: OPS[K] extends Op<any, any> ? GetOperation<any, OPS[K]> : never
}

export type OpGroupEnv<G> = EnvOf<G> & OpGroupEnvs<G>

export type OpGroupEnvs<A> = {
  readonly [K in TupleKeys<ReturnOf<A>>]: EnvOf<ReturnOf<A>[K]>
}[TupleKeys<ReturnOf<A>>]
