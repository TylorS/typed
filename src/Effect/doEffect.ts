import { EffectGenerator, EffectOf } from './Effect'

/**
 * Convert a Generator Function into an Effect
 */
export function doEffect<G extends () => EffectGenerator<any, any>>(
  effectGeneratorFunction: G,
): EffectOf<G> {
  return ({
    [Symbol.iterator]: effectGeneratorFunction,
  } as unknown) as EffectOf<G>
}
