import { Trace } from '@/Effect/Trace'

import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeSync } from './Processor'

export const processTrace = <R, E>(
  _trace: Trace,
  _previous: GeneratorNode<R, E>,
  processor: InstructionProcessor<R, E, any>,
) => new ResumeSync(processor.captureTrace())
