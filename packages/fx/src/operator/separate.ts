import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { filter } from './filter.js'
import { map } from './map.js'
import { multicast } from './multicast.js'

export function separate<R, E, A, B>(
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
