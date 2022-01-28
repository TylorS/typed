import { makeFiberId } from '@/FiberId'
import { Fx, Of } from '@/Fx'
import { increment } from '@/MutableRef'

import { FiberContext } from './FiberContext'

export function forkContext<E>(context: FiberContext<E>): Of<FiberContext<E>> {
  return Fx(function* () {
    return {
      ...context,
      fiberId: makeFiberId(increment(context.sequenceNumber)),
      locals: yield* context.locals.fork,
    }
  })
}
