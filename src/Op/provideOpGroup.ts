import { doEffect, Effect, EnvOf, ReturnOf } from '@typed/fp/Effect'
import { GetOperation, Op, OpEnv, provideOp } from '@typed/fp/Op'
import { pipe } from 'fp-ts/es6/pipeable'
import { mapWithIndex, reduce } from 'fp-ts/es6/ReadonlyArray'
import { IntersectOf } from 'Union/_api'

import { TupleKeys } from '../common'
import { useOp } from './provideOp'

/**
 * Allows providing multiple operations together which may require shared state, resources, or
 * simply for convenience.
 */
export function provideOpGroup<OPS extends ReadonlyArray<Op>, G extends OpGroup<OPS>>(
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

export function useOpGroup<OPS extends ReadonlyArray<Op>, G extends OpGroup<OPS>>(
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

export type OpEnvs<OPS extends ReadonlyArray<Op>> = IntersectOf<
  {
    [K in keyof OPS]: OPS[K] extends Op ? OpEnv<OPS[K]> : never
  }[number]
>

export type OpGroup<OPS extends ReadonlyArray<Op> = ReadonlyArray<Op>> = Effect<
  any,
  OpGroupEffects<OPS>
>

export type OpGroupEffects<OPS extends ReadonlyArray<Op>> = {
  readonly [K in keyof OPS]: OPS[K] extends Op ? GetOperation<any, OPS[K]> : never
}

export type OpGroupEnv<G> = EnvOf<G> & OpGroupEnvs<G>

export type OpGroupEnvs<A> = {
  readonly [K in TupleKeys<ReturnOf<A>>]: EnvOf<ReturnOf<A>[K]>
}[TupleKeys<ReturnOf<A>>]
