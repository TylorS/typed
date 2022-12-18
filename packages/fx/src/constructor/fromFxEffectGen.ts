import { Effect, EffectGen, gen } from '@effect/io/Effect'

import { Fx } from '../Fx.js'

import { fromFxEffect } from './fromFxEffect.js'

export type EffectAdapter = <R, E, A>(
  effect: Effect<R, E, A>,
) => Generator<EffectGen<R, E, A>, A, A>

export function fromFxEffectGen<Eff extends EffectGen<any, any, any>, R, E, A, N = unknown>(
  f: (adapter: EffectAdapter) => Generator<Eff, Fx<R, E, A>, N>,
): Fx<
  R | ([Eff] extends [never] ? never : [Eff] extends [EffectGen<infer R, any, any>] ? R : never),
  E | ([Eff] extends [never] ? never : [Eff] extends [EffectGen<any, infer E, any>] ? E : never),
  A
> {
  return fromFxEffect(gen(f as any))
}
