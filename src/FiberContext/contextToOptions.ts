import { makeFiberId } from '@/FiberId'
import { increment } from '@/MutableRef'

import { FiberContext } from './FiberContext'
import { FiberContextOptions } from './make'

export const contextToOptions = <E>(context: FiberContext<E>): FiberContextOptions<E> => ({
  fiberId: makeFiberId(increment(context.sequenceNumber)),
  renderer: context.renderer,
  reportFailure: context.reportFailure,
  sequenceNumber: context.sequenceNumber,
  scheduler: context.scheduler,
  locals: context.locals,
})
