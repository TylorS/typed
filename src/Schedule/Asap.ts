import { Clock, getCurrentTime } from '@/Clock'
import { Fiber } from '@/Fiber'
import { fromIO, Fx, RFx } from '@/Fx'
import { Timeline } from '@/Timeline'

export interface Asap {
  readonly asap: <R, E, A>(fx: Fx<R, E, A>) => RFx<Clock, Fiber<R, E, A>>
}

export interface FxTask<R, E, A> {
  readonly fx: Fx<R, E, A>
  readonly requirements: R
}

export function makeAsap<A>(timeline: Timeline<A>): Asap {
  return {
    asap: <R, E, A>(fx: Fx<R, E, A>): RFx<R & Clock, Fiber<R, E, A>> =>
      Fx(function* () {
        const time = yield* getCurrentTime

        yield* fromIO(() => timeline.add(time))
      }),
  }
}
