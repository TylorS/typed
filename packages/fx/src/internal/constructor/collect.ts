import type { Chunk } from '@effect/data/Chunk'
import { dualWithTrace } from '@effect/data/Debug'
import type { Option } from '@effect/data/Option'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const collect: {
  <A, R, E, B>(elements: Iterable<A>, f: (a: A) => Effect.Effect<R, Option<E>, B>): Fx<
    R,
    E,
    Chunk<B>
  >
  <A, R, E, B>(f: (a: A) => Effect.Effect<R, Option<E>, B>): (
    elements: Iterable<A>,
  ) => Fx<R, E, Chunk<B>>
} = dualWithTrace(
  2,
  (trace) =>
    <A, R, E, B>(
      elements: Iterable<A>,
      f: (a: A) => Effect.Effect<R, Option<E>, B>,
    ): Fx<R, E, Chunk<B>> =>
      fromEffect(Effect.collect(elements, f)).traced(trace),
)
