import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Option } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const succeedSome: <A>(a: A) => Fx<never, never, Option.Option<A>> = methodWithTrace(
  (trace) =>
    <A>(_: A) =>
      fromEffect(Effect.succeedSome(_)).traced(trace),
)