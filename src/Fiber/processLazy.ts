import { Lazy } from '@/Effect/Lazy'

import { Instruction } from './Instruction'
import { GeneratorNode } from './InstructionTree'
import { ResumeNode } from './Processor'

export const processLazy = <R, E, A>(lazy: Lazy<R, E, A>, previous: GeneratorNode<R, E>) =>
  new ResumeNode({
    type: 'Generator',
    generator: (lazy.input() as Instruction<R, E>)[Symbol.iterator](),
    method: 'next',
    previous,
  })
