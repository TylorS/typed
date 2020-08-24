import { doEffect, Effect, EnvOf, ZipEnvOf } from '@typed/fp/Effect'
import { GetOperation, Op, OpEnv, provideOp } from '@typed/fp/Op'
import { pipe } from 'fp-ts/es6/pipeable'
import { mapWithIndex, reduce } from 'fp-ts/es6/ReadonlyArray'
import { IntersectOf } from 'Union/_api'

/**
 * Allows providing multiple operations together which may require shared state, resources, or
 * simply for convenience.
 */
export function provideOpGroup<OPS extends ReadonlyArray<Op>, G extends OpGroup<OPS>>(
  ops: OPS,
  opGroup: G,
) {
  const provided = new WeakMap<Effect<any, any>, any>()

  return <E, A>(effect: Effect<E & OpEnvs<OPS>, A>): Effect<E & OpGroupEnv<G>, A> => {
    const eff = doEffect(function* () {
      const effects = provided.has(effect)
        ? provided.get(effect)!
        : provided.set(effect, yield* opGroup).get(effect)!

      return yield* pipe(
        ops,
        mapWithIndex((i, op) => provideOp(op, effects[i])),
        reduce(effect, (fx, provide) => provide(fx)),
      )
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

export type OpGroupEnv<G extends OpGroup> = EnvOf<G> & ZipEnvOf<OpGroupEffEnvs<OpsOf<G>>>

type OpsOf<A> = A extends OpGroup<infer R> ? R : never

type OpGroupEffEnvs<OPS extends ReadonlyArray<Op>> = CastEffectArray<
  {
    readonly [K in keyof OPS]: OPS[K] extends Op ? ReturnType<GetOperation<any, OPS[K]>> : never
  }
>

type CastEffectArray<A> = A extends ReadonlyArray<Effect<any, any>> ? A : []
