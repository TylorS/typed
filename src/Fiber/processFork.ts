import { Fork } from '@/Effect/Fork'
import { extendScope } from '@/Scope'

import { InstructionProcessor } from './InstructionProcessor'
import { GeneratorNode } from './InstructionTree'
import { ResumeSync } from './Processor'
// eslint-disable-next-line import/no-cycle
import { Runtime } from './Runtime'

export const processFork = <R, E, A>(
  fork: Fork<R, E, A>,
  _previous: GeneratorNode<R, E>,
  processor: InstructionProcessor<R, E, any>,
) => {
  const runtime = new Runtime(processor.resources, {
    context: processor.context,
    ...fork.input.runtimeOptions,
    scope: extendScope(fork.input.runtimeOptions?.scope ?? processor.scope),
  })

  return new ResumeSync(runtime.runFiber(fork.input.fx))
}
