import { ZipInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { ErrorOf, Fx, RequirementsOf, ValueOf } from './Fx'

export function zip<Fxs extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: Fxs
): Fx<RequirementsOf<Fxs[number]>, ErrorOf<Fxs[number]>, { [K in keyof Fxs]: ValueOf<Fxs[K]> }> {
  return fromInstruction(new ZipInstruction(fxs))
}
