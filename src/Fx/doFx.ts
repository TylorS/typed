import { Fx, GetEffects, GetNext, GetResult } from './Fx'

export function doFx<G extends Generator<any, any, any>>(
  generatorFn: () => G,
): Fx<GetEffects<G>, GetResult<G>, GetNext<G>> {
  return {
    [Symbol.iterator]: generatorFn,
  }
}
