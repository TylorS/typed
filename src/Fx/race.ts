import { RaceInstruction } from './Effects'
import { fromInstruction } from './fromInstruction'
import { ErrorOf, Fx, RequirementsOf, ValueOf } from './Fx'

export function race<Fxs extends readonly [Fx<any, any, any>, ...Array<Fx<any, any, any>>]>(
  ...fxs: Fxs
): Fx<RequirementsOf<Fxs[number]>, ErrorOf<Fxs[number]>, ValueOf<Fxs[number]>> {
  return fromInstruction(new RaceInstruction(fxs))
}
