import { readonlyArray } from 'fp-ts/ReadonlyArray'

import { Effect, ReturnOf } from './Effect'
import { effect, effectSeq } from './fp-ts'

export const zip: ZipEffects = (readonlyArray.sequence(effect) as unknown) as ZipEffects

export const zipSeq: ZipEffects = (readonlyArray.sequence(effectSeq) as unknown) as ZipEffects

export type ZipEffects = <A extends ReadonlyArray<Effect<any, any>>>(
  effects: A,
) => Effect<ZipEnvOf<A>, ZipReturnOf<A>>

export type ZipEnvOf<A extends ReadonlyArray<Effect<any, any>>> = A extends ReadonlyArray<
  Effect<infer R, any>
>
  ? R
  : never

export type ZipReturnOf<A extends ReadonlyArray<Effect<any, any>>> = {
  readonly [K in keyof A]: ReturnOf<A[K]>
}
