import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Either } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const succeedRight: <A>(a: A) => Fx<never, never, Either.Either<never, A>> = methodWithTrace(
  (trace) =>
    <A>(a: A) =>
      fromEffect(Effect.succeedRight(a)).traced(trace),
)
