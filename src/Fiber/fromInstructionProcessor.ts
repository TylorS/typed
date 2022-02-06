import { Async } from '@/Async'
import { fromAsync, fromIO } from '@/Effect'
import { Exit } from '@/Exit'
import { identity } from '@/function'

import { Fiber } from './Fiber'
import { InstructionProcessor } from './InstructionProcessor'
import { RuntimeProcessor } from './RuntimeProcessor'

export function fromInstructionProcessor<R, E, A>(
  processor: InstructionProcessor<R, E, A>,
  withRuntime: (runtime: RuntimeProcessor<E, A>) => void = identity,
): Fiber<E, A> {
  const runtime = new RuntimeProcessor(
    processor,
    processor.fiberContext.fiberId,
    processor.captureStackTrace,
    processor.shouldTrace,
    processor.scope.interruptableStatus,
  )
  const fiber: Fiber<E, A> = {
    type: 'RuntimeFiber',
    status: fromIO(() => runtime.status),
    exit: fromAsync(Async<Exit<E, A>>((cb) => runtime.addObserver(cb))),
    inheritRefs: processor.fiberContext.locals.inherit,
    dispose: runtime.dispose,
  }

  withRuntime(runtime)

  return fiber
}
