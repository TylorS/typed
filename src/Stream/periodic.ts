import { none } from 'fp-ts/Option'

import { fromIO } from '@/Fx'

import { make } from './Stream'

export const periodic = (period: number) =>
  make((sink, context) =>
    context.fiberContext.scheduler.periodic(
      period,
      fromIO(() =>
        sink.event({
          type: 'Event',
          fiberId: context.fiberContext.fiberId,
          operator: 'periodic',
          time: context.fiberContext.scheduler.getCurrentTime(),
          value: undefined,
          trace: none,
        }),
      ),
      context,
    ),
  )
