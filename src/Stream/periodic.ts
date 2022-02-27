import { fromLazy } from '@/Fx'

import { make } from './Stream'

export const periodic = (period: number) =>
  make((sink, context) =>
    context.fiberContext.scheduler
      .periodic(
        period,
        fromLazy(() =>
          sink.event({
            type: 'Event',
            fiberId: context.fiberContext.fiberId,
            operator: 'periodic',
            time: context.fiberContext.scheduler.getCurrentTime(),
            value: undefined,
          }),
        ),
        context,
      )
      .dispose(context.fiberContext.fiberId),
  )
