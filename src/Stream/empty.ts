import { none } from 'fp-ts/Option'

import { fromIO } from '@/Fx'
import { tryEnd } from '@/Sink'

import { make, Stream } from './Stream'

export function empty<E = never, A = never>(): Stream<unknown, E, A> {
  return make((resources, sink, context, scope) =>
    context.scheduler.asap(
      fromIO(() =>
        tryEnd(sink, {
          type: 'End',
          operator: 'empty',
          time: context.scheduler.getCurrentTime(),
          trace: none,
        }),
      ),
      resources,
      context,
      scope,
    ),
  )
}
