import { EffectGenerator, EffectOf } from './Effect'

export function doEffect<G extends () => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): EffectOf<G> {
  return ({
    [Symbol.iterator]: effectGeneratorFunction,
  } as unknown) as EffectOf<G>
}
