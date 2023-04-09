import { Fx, Sink } from '@typed/fx/Fx'
import { Effect } from '@typed/fx/externals'

export function slice<R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A> {
  return Fx(
    <R2>(sink: Sink<R2, E, A>): Effect.Effect<R | R2, never, void> =>
      Effect.asyncEffect((cb) => {
        let toSkip = skip
        let toTake = take

        return fx.run(
          Sink(
            (a) =>
              Effect.suspend(() => {
                if (toSkip > 0) {
                  toSkip -= 1
                  return Effect.unit()
                }

                if (toTake > 0) {
                  toTake -= 1
                  return Effect.tap(sink.event(a), () =>
                    Effect.sync(() => toTake === 0 && cb(Effect.unit())),
                  )
                }

                return Effect.sync(() => cb(Effect.unit()))
              }),
            sink.error,
          ),
        )
      }),
  )
}

export function skip<R, E, A>(fx: Fx<R, E, A>, skip: number): Fx<R, E, A> {
  return slice(fx, skip, Infinity)
}

export function take<R, E, A>(fx: Fx<R, E, A>, take: number): Fx<R, E, A> {
  return slice(fx, 0, take)
}
