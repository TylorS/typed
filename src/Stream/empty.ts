import { fromIO } from '@/Fx'
import { tryEnd } from '@/Sink'

import { make, Stream } from './Stream'

export function empty<E = never, A = never>(): Stream<unknown, E, A> {
  return make((sink, context) =>
    context.fiberContext.scheduler.asap(
      fromIO(() =>
        tryEnd(sink, {
          type: 'End',
          operator: 'empty',
          time: context.fiberContext.scheduler.getCurrentTime(),
          fiberId: context.fiberContext.fiberId,
        }),
      ),
      context,
    ),
  )
}
