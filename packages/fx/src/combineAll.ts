import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { map } from './map.js'
import { succeed } from './succeed.js'

export function combineAll<FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fx: FX
): Fx<
  Fx.ResourcesOf<FX[number]>,
  Fx.ErrorsOf<FX[number]>,
  {
    [k in keyof FX]: Fx.OutputOf<FX[k]>
  }
> {
  if (fx.length === 0) {
    return succeed([]) as any
  }

  if (fx.length === 1) {
    return map(fx[0], (x) => [x]) as any
  }

  return Fx((sink) =>
    Effect.gen(function* ($) {
      const length = fx.length
      const values = new Map<number, any>()

      const emitIfReady = Effect.suspend(() =>
        values.size === length
          ? sink.event(
              Array.from({ length }, (_, i) => values.get(i)) as {
                [k in keyof FX]: Fx.OutputOf<FX[k]>
              },
            )
          : Effect.unit(),
      )

      yield* $(
        Effect.forEachParWithIndex(fx, (f, i) =>
          f.run(
            Sink(
              (a) =>
                Effect.suspend(() => {
                  values.set(i, a)
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

export function combine<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  other: Fx<R2, E2, B>,
): Fx<R | R2, E | E2, readonly [A, B]> {
  return combineAll(fx, other)
}
