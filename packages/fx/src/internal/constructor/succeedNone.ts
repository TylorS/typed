import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Option } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const succeedNone: (_: void) => Fx<never, never, Option.Option<never>> = methodWithTrace(
  (trace) => () => fromEffect(Effect.succeedNone()).traced(trace),
)
