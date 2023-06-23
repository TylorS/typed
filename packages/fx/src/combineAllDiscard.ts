import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { map } from './map.js'
import { succeed } from './succeed.js'

export function combineAllDiscard<FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fx: FX
): Fx<Fx.ResourcesOf<FX[number]>, Fx.ErrorsOf<FX[number]>, void> {
  if (fx.length === 0) {
    return succeed([]) as any
  }

  if (fx.length === 1) {
    return map(fx[0], (x) => [x]) as any
  }

  return Fx((sink) =>
    Effect.suspend(() => {
      const length = fx.length
      const values = new Map<number, any>()

      const emitIfReady = Effect.suspend(() =>
        values.size === length ? sink.event() : Effect.unit(),
      )

      return Effect.asUnit(
        Effect.forEachParWithIndex(fx, (f, i) =>
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
        ),
      )
    }),
  )
}
