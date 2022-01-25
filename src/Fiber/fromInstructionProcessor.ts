import { Async } from '@/Async'
import { fromAsync, fromIO } from '@/Effect'
import { Exit } from '@/Exit'

import { Fiber } from './Fiber'
import { InstructionProcessor } from './InstructionProcessor'
import { RuntimeProcessor } from './RuntimeProcessor'

export function fromInstructionProcessor<R, E, A>(
  processor: InstructionProcessor<R, E, A>,
): Fiber<E, A> {
  const runtime = new RuntimeProcessor(
    processor,
    processor.captureStackTrace,
    processor.shouldTrace,
    processor.scope.interruptableStatus,
  )
  const fiber: Fiber<E, A> = {
    type: 'RuntimeFiber',
    status: fromIO(() => runtime.status),
    exit: fromAsync(Async<Exit<E, A>>((cb) => runtime.addObserver(cb))),
    inheritRefs: processor.context.locals.inherit,
    dispose: runtime.dispose,
  }

  // Always start fibers asynchronously to allow for parent fiber to cancel the operation if necessary.
  runtime.processLater()

  return fiber
}
