import { Trace } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeSync } from './RuntimeInstruction'

export const processTrace = <R, E>(_: Trace, processor: InstructionProcessor<R, E, any>) =>
  new ResumeSync(processor.captureStackTrace())
