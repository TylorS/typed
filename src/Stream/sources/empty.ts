import { Now } from '@/Schedule'

import { Stream } from '../Stream'

export const empty: Stream<unknown, never> = {
  run: (sink, { scope, context }) =>
    context.scheduler.schedule(sink.end, {
      schedule: Now,
      scope,
      context,
    }),
}
