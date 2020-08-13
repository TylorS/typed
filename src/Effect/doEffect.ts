import { HeadArg } from '@typed/fp/common'
import { ask } from './ask'
import { AddEnv, EffectGenerator, EffectOf } from './Effect'

export const doEffect = <G extends () => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): EffectOf<G> =>
  (({
    [Symbol.iterator]: effectGeneratorFunction,
  } as unknown) as EffectOf<G>)

export const doEffectWith = <G extends (e: any) => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): AddEnv<HeadArg<G>, EffectOf<G>> =>
  doEffect(function* () {
    const e1 = yield* ask<HeadArg<G>>()

    return yield* effectGeneratorFunction(e1)
  })
