import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fail } from '@typed/fx/internal/constructor/fail'
import { Option } from '@typed/fx/internal/externals'
import { unit } from '@typed/fx/internal/typeclass/Of'

export const noneOrFailWith: {
  <A, E>(option: Option.Option<A>, f: (a: A) => E): Fx<never, E, void>

  <A, E>(f: (a: A) => E): (option: Option.Option<A>) => Fx<never, E, void>
} = dualWithTrace(
  2,
  (trace, restore) =>
    <A, E>(option: Option.Option<A>, f: (a: A) => E) =>
      Option.match(
        option,
        () => unit.traced(trace),
        (a) => fail(restore(f)(a)).traced(trace),
      ),
)
