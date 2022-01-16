import { Chain } from '@/Effect/Chain'

import { Instruction } from './Instruction'
import { GeneratorNode } from './InstructionTree'
import { ResumeNode } from './Processor'

export const processChain = <R, E, A, R2, E2, B>(
  chain: Chain<R, E, A, R2, E2, B>,
  previous: GeneratorNode<R & R2, E | E2>,
) => {
  const instruction = chain.input.effect as Instruction<R, E>

  const generator = (function* () {
    const a = yield* instruction

    return yield* chain.input.f(a) as Instruction<R, E>
  })()

  return new ResumeNode({
    type: 'Generator',
    generator,
    method: 'next',
    previous,
  })
}
