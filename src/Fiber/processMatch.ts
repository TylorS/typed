import { isRight } from 'fp-ts/Either'

import { isExpected } from '@/Cause'
import { Match } from '@/Effect/Match'
import { extendScope } from '@/Scope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeDeferred, ResumeNode, ResumeSync, RunInstruction } from './Processor'

export const processMatch = <R, E, A, R2, E2, B, R3, E3, C>(
  match: Match<R, E, A, R2, E2, B, R3, E3, C>,
  previous: GeneratorNode<R & R2 & R3, E>,
  runtime: InstructionProcessor<R & R2 & R3, E | E2 | E3, any>,
  run: RunInstruction,
) =>
  new ResumeDeferred<R & R2 & R3, E | E2 | E3, B | C>((cb) =>
    run(
      match.input.effect as Instruction<R, E>,
      runtime.resources,
      runtime.context,
      extendScope(runtime.scope),
      (exit) => {
        if (isRight(exit)) {
          return cb(new ResumeSync(exit.right))
        }

        if (isExpected(exit.left)) {
          return cb(
            new ResumeNode<R & R2 & R3, E | E2 | E3>({
              type: 'Generator',
              generator: (
                match.input.onLeft(exit.left.error) as Instruction<R & R2 & R3, E | E2 | E3>
              )[Symbol.iterator](),
              method: 'next',
              previous,
            }),
          )
        }

        return new ResumeNode({ type: 'Exit', exit })
      },
    ),
  )
