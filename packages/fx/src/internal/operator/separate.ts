import { pipe } from '@effect/data/Function'

import type { Fx } from '@typed/fx/internal/Fx'
import { exit } from '@typed/fx/internal/error/index'
import { Cause, Either, Exit, Option } from '@typed/fx/internal/externals'
import { filter, filterMap } from '@typed/fx/internal/operator/filterMap'
import { map } from '@typed/fx/internal/operator/map'
import { multicast } from '@typed/fx/internal/operator/multicast'

export function separate<R, E, A>(fx: Fx<R, E, A>): readonly [Fx<R, never, E>, Fx<R, never, A>] {
  const s = multicast(exit(fx))

  return [
    pipe(
      s,
      filterMap((e) => (Exit.isFailure(e) ? Cause.failureOption(e.cause) : Option.none())),
    ),
    pipe(
      s,
      filterMap((e) => (Exit.isSuccess(e) ? Option.some(e.value) : Option.none())),
    ),
  ]
}

export function separateEither<R, E, A, B>(
  fx: Fx<R, E, Either.Either<A, B>>,
): readonly [Fx<R, E, A>, Fx<R, E, B>] {
  const s = multicast(fx)

  return [
    pipe(
      s,
      filter(Either.isLeft<A, B>),
      map((e) => e.left),
    ),
    pipe(
      s,
      filter(Either.isRight),
      map((e) => e.right),
    ),
  ]
}
