import { Fx, Sink } from './Fx.js'
import { Duration, Effect } from './externals.js'
import { withExhaust } from './helpers.js'

export function throttle<R, E, A>(fx: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return Fx(<R2>(sink: Sink<R2, E, A>) =>
    withExhaust((fork) =>
      fx.run(Sink((a) => fork(Effect.zipLeft(sink.event(a), Effect.sleep(duration))), sink.error)),
    ),
  )
}
