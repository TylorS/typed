import { Fx, Sink } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'

export function reduce<R, E, A, B>(fx: Fx<R, E, A>, b: B, f: (b: B, a: A) => B): Fx<R, E, B> {
  return Fx((sink) =>
    Effect.suspend(() => {
      let acc = b

      return fx.run(Sink((a) => Effect.sync(() => (acc = f(acc, a))), sink.error))
    }),
  )
}
