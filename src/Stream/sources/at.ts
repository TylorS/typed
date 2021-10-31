import { Time } from '@/Clock'

import { Stream } from '../Stream'

export const at =
  (time: Time) =>
  <A>(value: A): Stream<unknown, A> => ({
    run: (sink, options) => options.context.scheduler.delay(sink.event(value), time, options),
  })
