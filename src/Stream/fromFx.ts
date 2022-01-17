import { Fx } from '@/Fx'
import { tryEnd, tryEvent } from '@/Sink'

import { make, Stream } from './Stream'

export function fromFx<R, E, A>(fx: Fx<R, E, A>): Stream<R, E, A> {
  return make((resources, sink, context, scope) =>
    context.scheduler.asap(
      Fx(function* () {
        const a = yield* fx
        const time = context.scheduler.getCurrentTime()

        tryEvent(sink, time, a)
        tryEnd(sink, time)
      }),
      resources,
      context,
      scope,
    ),
  )
}
