import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { map } from './map.js'
import { unit } from './succeed.js'

export function combineAllDiscard<FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fx: FX
): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, void> {
  if (fx.length === 0) {
    return unit
  }

  if (fx.length === 1) {
    return map(fx[0], (x) => void x)
  }

  return Fx((sink) =>
    Effect.suspend(() => {
      const length = fx.length
      const values = new Map<number, any>()

      const emitIfReady = Effect.suspend(() =>
        values.size === length ? sink.event() : Effect.unit,
      )

      return Effect.asUnit(
        Effect.forEach(
          fx,
          (f, i) =>
            f.run(
              Sink(
                () =>
                  Effect.suspend(() => {
                    values.set(i, null)
                    return emitIfReady
                  }),
                sink.error,
              ),
            ),
          { concurrency: 'unbounded' },
        ),
      )
    }),
  )
}
