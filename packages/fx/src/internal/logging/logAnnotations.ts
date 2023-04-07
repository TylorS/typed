import { methodWithTrace } from '@effect/data/Debug'
import type * as HashMap from '@effect/data/HashMap'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect } from '@typed/fx/internal/externals'

export const logAnnotations: (_: void) => Fx<never, never, HashMap.HashMap<string, string>> =
  methodWithTrace((trace) => () => fromEffect(Effect.logAnnotations()).traced(trace))
