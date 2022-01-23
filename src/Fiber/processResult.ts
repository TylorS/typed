import { Result } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ResultInstruction } from './Processor'

export const processResult = <R, E, A>(
  instruction: Result<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
): ResultInstruction<R, E, A> => ({
  type: 'Result',
  processor: processor.extend(instruction.input, processor.resources),
})
