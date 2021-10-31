import { Time } from '@/Clock'
import * as Schedule from '@/Schedule'

import { Stream } from '../Stream'

export const periodic = (period: Time): Stream<unknown, void> => ({
  run: (sink, { scope, context }) =>
    context.scheduler.schedule(sink.event(), {
      schedule: Schedule.periodic(period),
      scope,
      context,
    }),
})
