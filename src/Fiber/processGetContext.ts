import { GetContext } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeSync } from './RuntimeInstruction'

export const processGetContext = <E, R, A>(
  _: GetContext<E>,
  processor: InstructionProcessor<R, E, A>,
) => new ResumeSync(processor.fiberContext)
