import { isRight } from 'fp-ts/Either'

import { isUnexpected } from '@/Cause'
import { Refine } from '@/Effect/Refine'
import * as Exit from '@/Exit'
import { extendScope } from '@/Scope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeDeferred, ResumeNode, ResumeSync, RunInstruction } from './Processor'

export const processRefine = <R, E, A, E2>(
  refine: Refine<R, E, A, E2>,
  _previous: GeneratorNode<R, E | E2>,
  processor: InstructionProcessor<R, E | E2, any>,
  run: RunInstruction,
) =>
  new ResumeDeferred<R, E | E2, A>((cb) =>
    run(
      refine.input.effect as Instruction<R, E>,
      processor.resources,
      processor.context,
      extendScope(processor.scope),
      (exit) => {
        if (isRight(exit)) {
          return cb(new ResumeSync(exit.right))
        }

        if (isUnexpected(exit.left) && refine.input.refinement(exit.left.error)) {
          return cb(
            new ResumeNode({ type: 'Exit', exit: Exit.expected(exit.left.error as E | E2) }),
          )
        }

        return cb(new ResumeNode({ type: 'Exit', exit: exit as Exit.Exit<E | E2, A> }))
      },
    ),
  )
