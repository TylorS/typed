import { GetScope } from '@/Effect'

import { InstructionProcessor } from './InstructionProcessor'
import { ResumeSync } from './RuntimeInstruction'

export const processGetScope = <E, A, R>(
  _: GetScope<E, A>,
  processor: InstructionProcessor<R, E, any>,
) => new ResumeSync(processor.context)
