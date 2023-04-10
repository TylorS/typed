import { Fx, Sink } from './Fx.js'
import { Effect } from './externals.js'

export function scan<R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B> {
  return Fx((sink) =>
    Effect.suspend(() => {
      let state = seed

      return Effect.flatMap(sink.event(state), () =>
        fx.run(Sink((a) => Effect.suspend(() => sink.event((state = f(state, a)))), sink.error)),
      )
    }),
  )
}
