import { And } from '@typed/fp/common/And'
import { readonlyArray } from 'fp-ts/ReadonlyArray'
import { A } from 'ts-toolbelt'

import { Effect, EnvOf, ReturnOf } from './Effect'
import { effect, effectSeq } from './fp-ts'

export const zip: ZipEffects = (readonlyArray.sequence(effect) as unknown) as ZipEffects

export const zipSeq: ZipEffects = (readonlyArray.sequence(effectSeq) as unknown) as ZipEffects

export type ZipEffects = <A extends ReadonlyArray<Effect<any, any>>>(
  effects: A,
) => Effect<ZipEnvOf<A>, ZipReturnOf<A>>

export type ZipEnvOf<A extends ReadonlyArray<Effect<any, any>>> = And<
  A.Cast<{ readonly [K in keyof A]: EnvOf<A[K]> }, ReadonlyArray<any>>
>

export type ZipReturnOf<A extends ReadonlyArray<Effect<any, any>>> = {
  readonly [K in keyof A]: ReturnOf<A[K]>
}
