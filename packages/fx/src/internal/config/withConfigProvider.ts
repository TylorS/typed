import { dualWithTrace } from '@effect/data/Debug'
import type { ConfigProvider } from '@effect/io/Config/Provider'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const withConfigProvider: {
  <R, E, A>(fx: Fx<R, E, A>, provider: ConfigProvider): Fx<R, E, A>
  (provider: ConfigProvider): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, provider: ConfigProvider) =>
      fx.transform(Effect.withConfigProvider(provider)).traced(trace),
)
