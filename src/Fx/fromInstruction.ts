import { Fx } from './Fx'
import * as Instruction from './Instruction'

export function fromInstruction<R, E, A>(
  instruction: Instruction.Instruction<R, E, A>,
): Fx<R, E, A> {
  return Fx(function* () {
    const a = yield instruction

    return a as A
  })
}
