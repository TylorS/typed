import { makeFiberId } from '@/FiberId'
import { Fx, Of } from '@/Fx'
import { increment } from '@/MutableRef'

import { Context } from './Context'

export function forkContext<E>(context: Context<E>): Of<Context<E>> {
  return Fx(function* () {
    return {
      ...context,
      fiberId: makeFiberId(increment(context.sequenceNumber)),
      locals: yield* context.locals.fork,
    }
  })
}
