import { TracingStatus } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ScopedInstruction } from './Processor'

export const processTracingStatus = <R, E, A>(
  instr: TracingStatus<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
): ScopedInstruction<R, E, A> => ({
  type: 'Scoped',
  processor: processor.extend(instr.input.fx, processor.resources, instr.input.tracingStatus),
})
