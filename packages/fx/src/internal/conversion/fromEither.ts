import { methodWithTrace } from '@effect/data/Debug'
import type { Either } from '@effect/data/Either'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const fromEither: <E, A>(either: Either<E, A>) => Fx<never, E, A> = methodWithTrace(
  (trace) => (either) => fromEffect(Effect.fromEither(either)).traced(trace),
)
