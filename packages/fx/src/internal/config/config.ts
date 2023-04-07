import { methodWithTrace } from '@effect/data/Debug'
import type { Config } from '@effect/io/Config'
import type { ConfigError } from '@effect/io/Config/Error'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const config: <A>(config: Config<A>) => Fx<never, ConfigError, A> = methodWithTrace(
  (trace) =>
    <A>(config: Config<A>) =>
      fromEffect(Effect.config(config)).traced(trace),
)
