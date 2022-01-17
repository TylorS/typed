import { isRight } from 'fp-ts/Either'

import { Provide } from '@/Effect/Provide'
import { extendScope } from '@/Scope/extendScope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeDeferred, ResumeNode, ResumeSync, RunInstruction } from './Processor'

export const processProvide = <R, E, A>(
  provide: Provide<R, E, A>,
  _previous: GeneratorNode<R, E>,
  processor: InstructionProcessor<R, E, any>,
  run: RunInstruction,
) =>
  new ResumeDeferred<unknown, E, A>((cb) =>
    run(
      provide.input.effect as Instruction<R, E>,
      provide.input.resources,
      processor.context,
      extendScope(processor.scope),
      (exit) => {
        if (isRight(exit)) {
          return cb(new ResumeSync(exit.right))
        }

        return cb(new ResumeNode({ type: 'Exit', exit }))
      },
    ),
  )
