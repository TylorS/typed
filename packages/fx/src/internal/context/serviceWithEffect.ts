import type { Trace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Context } from '@typed/fx/internal/externals'
import { Debug, Effect } from '@typed/fx/internal/externals'

export const serviceWithEffect: {
  <I, A, R2, E2, B>(tag: Context.Tag<I, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<
    R2 | I,
    E2,
    B
  >
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <I>(
    tag: Context.Tag<I, A>,
  ) => Fx<R2 | I, E2, B>
} = Debug.dualWithTrace(
  2,
  (trace: Trace) =>
    <I, A, R2, E2, B>(tag: Context.Tag<I, A>, f: (a: A) => Effect.Effect<R2, E2, B>) =>
      fromEffect(Effect.flatMap(tag, f)).traced(trace),
)
