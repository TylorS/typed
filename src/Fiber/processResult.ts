import { Result } from '@/Effect/Result'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeDeferred, ResumeSync, RunInstruction } from './Processor'

export const processResult = <R, E, A>(
  match: Result<R, E, A>,
  _previousNode: GeneratorNode<R, E>,
  runtime: InstructionProcessor<R, E, any>,
  run: RunInstruction,
) =>
  new ResumeDeferred((cb) =>
    run(
      match.input as Instruction<R, E>,
      runtime.resources,
      runtime.context,
      runtime.scope,
      (exit) => cb(new ResumeSync(exit)),
    ),
  )
