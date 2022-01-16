import { GetContext } from '@/Effect/GetContext'

import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeSync } from './Processor'

export const processGetContext = <E, R>(
  _: GetContext<E>,
  _previous: GeneratorNode<R, E>,
  runtime: InstructionProcessor<R, E, any>,
) => new ResumeSync(runtime.context)
