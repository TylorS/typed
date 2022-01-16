import { none, some } from 'fp-ts/Option'

import { fromExit } from '@/Effect/FromExit'
import { TracingStatus } from '@/Effect/TracingStatus'
import { extendScope } from '@/Scope'

import { Instruction } from './Instruction'
import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { Resume, ResumeDeferred, ResumeNode } from './Processor'

export const processTracingStatus = <R, E, A>(
  instruction: TracingStatus<R, E, A>,
  previous: GeneratorNode<R, E>,
  processor: InstructionProcessor<R, E, any>,
): Resume<R, E, A> =>
  new ResumeDeferred((cb) => {
    const tracingProcessor = new InstructionProcessor(
      instruction.input.effect as Instruction<R, E>,
      processor.resources,
      processor.context,
      extendScope(processor.scope),
      processor.processors,
      processor.shouldTrace ? some(processor.captureTrace()) : none,
      instruction.input.tracingStatus,
    )

    tracingProcessor.addObserver((exit) =>
      cb(new ResumeNode({ type: 'Instruction', instruction: fromExit(exit), previous })),
    )

    return tracingProcessor
  })
