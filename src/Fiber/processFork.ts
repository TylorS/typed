import { forkContext } from '@/Context/forkContext'
import { Fork } from '@/Effect'
import { Fx } from '@/Fx'

import { fromInstructionProcessor } from './fromInstructionProcessor'
import { InstructionProcessor } from './InstructionProcessor'
import { DeferredInstruction } from './Processor'
import { ResumeSync } from './RuntimeInstruction'

export const processFork = <R, E, A>(
  instruction: Fork<R, E, A>,
  processor: InstructionProcessor<R, E, any>,
): DeferredInstruction<R, E, A> => ({
  type: 'Deferred',
  fx: Fx(function* () {
    const context =
      instruction.input.runtimeOptions?.context ?? (yield* forkContext(processor.context))
    const scope = instruction.input.runtimeOptions?.scope ?? processor.scope

    return new ResumeSync(
      fromInstructionProcessor(
        processor.fork(instruction.input.fx, {
          ...instruction.input.runtimeOptions,
          scope,
          context,
        }),
      ),
    )
  }),
})
