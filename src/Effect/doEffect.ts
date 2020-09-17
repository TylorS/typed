import { HeadArg } from '@typed/fp/common/exports'

import { ask } from './ask'
import { AddEnv, EffectGenerator, EffectOf } from './Effect'

/**
 * @since 0.0.1
 */
export function doEffect<G extends () => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): EffectOf<G> {
  return ({
    [Symbol.iterator]: effectGeneratorFunction,
  } as unknown) as EffectOf<G>
}

/**
 * @since 0.0.1
 */
export const doEffectWith = <G extends (env: unknown) => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): AddEnv<HeadArg<G>, EffectOf<G>> =>
  doEffect(function* () {
    const e1 = yield* ask<HeadArg<G>>()

    return yield* effectGeneratorFunction(e1)
  })
