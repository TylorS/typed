import { GetScope } from '@/Effect/GetScope'

import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeSync } from './Processor'

export const processGetScope = <E, R>(
  _: GetScope<E, any>,
  _previous: GeneratorNode<R, E>,
  runtime: InstructionProcessor<R, E, any>,
) => new ResumeSync(runtime.scope)
