import { methodWithTrace } from '@effect/data/Debug'
import type { NoSuchElementException } from '@effect/io/Cause'

import type { Fx } from '@typed/fx/internal/Fx'
import type { Option } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const getOrFail: <A>(option: Option.Option<A>) => Fx<never, NoSuchElementException, A> =
  methodWithTrace(
    (trace) =>
      <A>(option: Option.Option<A>): Fx<never, NoSuchElementException, A> =>
        fromEffect(Effect.getOrFail(option).traced(trace)),
  )
