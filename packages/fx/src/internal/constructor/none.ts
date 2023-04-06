import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Option } from '@typed/fx/internal/_externals'
import { fail } from '@typed/fx/internal/constructor/fail'
import { flatMap } from '@typed/fx/internal/operator/flatMap'
import { unit } from '@typed/fx/internal/typeclass/Of'

export const none: <R, E, A>(fx: Fx<R, E, Option.Option<A>>) => Fx<R, E | A, void> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Fx<R, E, Option.Option<A>>): Fx<R, A | E, void> =>
        flatMap(
          fx,
          Option.match(() => unit, fail),
        ).traced(trace),
  )
