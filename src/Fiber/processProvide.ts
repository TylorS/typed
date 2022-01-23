import { Provide } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ScopedInstruction } from './Processor'

export const processProvide = <R, E, A>(
  instruction: Provide<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
): ScopedInstruction<R, E, A> => ({
  type: 'Scoped',
  processor: processor.extend(instruction.input.fx, instruction.input.resources),
})
