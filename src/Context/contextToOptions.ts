import { makeFiberId } from '@/FiberId'
import { increment } from '@/MutableRef'

import { Context } from './Context'
import { ContextOptions } from './make'

export const contextToOptions = <E>(context: Context<E>): ContextOptions<E> => ({
  fiberId: makeFiberId(increment(context.sequenceNumber)),
  renderer: context.renderer,
  reportFailure: context.reportFailure,
  sequenceNumber: context.sequenceNumber,
  scheduler: context.scheduler,
  locals: context.locals,
})
