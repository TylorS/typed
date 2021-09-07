import { ErrorOf, RequirementsOf, ValueOf } from '@/internal'

import { Fx } from './Fx'
import { Instruction } from './Instruction'

export function fromInstruction<I extends Instruction<any, any, any>>(
  instruction: I,
): Fx<RequirementsOf<I>, ErrorOf<I>, ValueOf<I>> {
  return Fx(function* () {
    const a = yield instruction

    return a as ValueOf<I>
  }) as Fx<RequirementsOf<I>, ErrorOf<I>, ValueOf<I>>
}
