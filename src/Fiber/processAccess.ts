import { Access } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ProcessorInstruction } from './Processor'

export const processAccess = <R, R2, E, A>(
  instruction: Access<R, R2, E, A>,
  processor: InstructionProcessor<R & R2, E, any>,
): ProcessorInstruction<R2, E, A> => ({
  type: 'Fx',
  fx: instruction.input(processor.resources),
})
