import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Context, Effect } from '@typed/fx/internal/externals'

export const provideContext: {
  <R, E, A>(fx: Fx<R, E, A>, context: Context.Context<R>): Fx<never, E, A>
  <R>(context: Context.Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, context: Context.Context<R>): Fx<never, E, A> =>
      fx.transform(Effect.contramapContext(Context.merge(context))).traced(trace),
)
