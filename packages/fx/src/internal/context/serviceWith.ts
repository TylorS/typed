import type { Trace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Context } from '@typed/fx/internal/_externals'
import { Debug, Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const serviceWith: {
  <I, A, B>(tag: Context.Tag<I, A>, f: (a: A) => B): Fx<I, never, B>

  <A, B>(f: (a: A) => B): <I>(tag: Context.Tag<I, A>) => Fx<I, never, B>
} = Debug.dualWithTrace(
  2,
  (trace: Trace) =>
    <I, A, B>(tag: Context.Tag<I, A>, f: (a: A) => B) =>
      fromEffect(Effect.map(tag, f)).traced(trace),
)
