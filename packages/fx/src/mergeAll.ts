import { Fx, Sink } from '@typed/fx/Fx'
import { Cause, Effect } from '@typed/fx/externals'

export function mergeAll<FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
): Fx<Fx.ResourcesOf<FXS[number]>, Fx.ErrorsOf<FXS[number]>, Fx.OutputOf<FXS[number]>> {
  return Fx((sink) =>
    Effect.forEachParDiscard(fxs, (fx) =>
      fx.run(
        Sink(sink.event, (cause) =>
          Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
        ),
      ),
    ),
  )
}

export function merge<R, E, A, R2, E2, B>(
  self: Fx<R, E, A>,
  other: Fx<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return mergeAll(self, other)
}
