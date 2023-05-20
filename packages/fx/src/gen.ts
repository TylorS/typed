import * as Effect from '@effect/io/Effect'

import type { Fx } from './Fx.js'
import { fromFxEffect } from './fromFxEffect.js'

export type EffectGenResources<T> = [T] extends [never]
  ? never
  : T extends Effect.EffectGen<infer R, any, any>
  ? R
  : never

export type EffectGenErrors<T> = [T] extends [never]
  ? never
  : T extends Effect.EffectGen<any, infer E, any>
  ? E
  : never

export type EffectGenOutput<T> = [T] extends [never]
  ? never
  : T extends Effect.EffectGen<any, any, infer A>
  ? A
  : never

export function gen<Y extends Effect.EffectGen<any, any, any>, R, E, A>(
  f: (adapter: Effect.Adapter) => Generator<Y, Fx<R, E, A>>,
): Fx<R | EffectGenResources<Y>, E | EffectGenErrors<Y>, A> {
  return fromFxEffect(Effect.gen(f)) as Fx<R | EffectGenResources<Y>, E | EffectGenErrors<Y>, A>
}
