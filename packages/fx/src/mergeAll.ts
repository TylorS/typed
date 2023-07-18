import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { compact } from './filterMap.js'
import { map } from './map.js'

export function mergeAll<FXS extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FXS
): Fx<Fx.ResourcesOf<FXS[number]>, Fx.ErrorsOf<FXS[number]>, Fx.OutputOf<FXS[number]>> {
  return Fx((sink) =>
    Effect.forEach(
      fxs,
      (fx) =>
        fx.run(
          Sink(sink.event, (cause) =>
            Cause.isInterruptedOnly(cause) ? Effect.unit : sink.error(cause),
          ),
        ),
      { concurrency: 'unbounded', discard: true },
    ),
  )
}

export function merge<R, E, A, R2, E2, B>(
  self: Fx<R, E, A>,
  other: Fx<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return mergeAll(self, other)
}

export function mergeFirst<R, E, A, R2, E2, B>(
  self: Fx<R, E, A>,
  other: Fx<R2, E2, B>,
): Fx<R | R2, E | E2, A> {
  return compact(mergeAll(map(self, Option.some), map(other, Option.none)))
}
