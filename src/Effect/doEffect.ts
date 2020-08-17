import { ArgsOf, HeadArg } from '@typed/fp/common'
import { ask } from '@typed/fp/Effect/ask'
import { AddEnv, EffectGenerator, EffectOf } from '@typed/fp/Effect/Effect'

import { Fn } from '../lambda'

/**
 * @since 0.0.1
 */
export const doEffect = <G extends () => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): EffectOf<G> =>
  (({
    [Symbol.iterator]: effectGeneratorFunction,
  } as unknown) as EffectOf<G>)

/**
 * @since 0.0.1
 */
export const doEffectWith = <G extends (e: any) => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): AddEnv<HeadArg<G>, EffectOf<G>> =>
  doEffect(function* () {
    const e1 = yield* ask<HeadArg<G>>()

    return yield* effectGeneratorFunction(e1)
  })

export const op = <G extends Fn<readonly any[], EffectGenerator<any, any>>>(
  effectGeneratorFunction: G,
) => (...args: ArgsOf<G>): EffectOf<G> =>
  doEffect(() => effectGeneratorFunction(...args)) as EffectOf<G>
