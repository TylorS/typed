import { Access } from '@/Effect/Access'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeNode } from './Processor'

export const processAccess = <R, R2, E, A>(
  access: Access<R, R2, E, A>,
  previous: GeneratorNode<R & R2, E>,
  processor: InstructionProcessor<R & R2, E, any>,
) =>
  new ResumeNode({
    type: 'Generator',
    generator: (access.input(processor.resources) as Instruction<R2, E>)[Symbol.iterator](),
    method: 'next',
    previous,
  })
