import { fromExit } from '@/Effect/FromExit'
import { Join } from '@/Effect/Join'
import { Fx } from '@/Fx'

import { GeneratorNode } from './InstructionTree'
import { ResumeNode } from './Processor'

export const processJoin = <E, A, R>(join: Join<E, A>, previous: GeneratorNode<R, E>) =>
  new ResumeNode({
    type: 'Generator',
    generator: Fx(function* () {
      const exit = yield* join.input.exit
      const a = yield* fromExit(exit)

      yield* join.input.inheritRefs

      return a
    })[Symbol.iterator](),
    method: 'next',
    previous,
  })
