import { IO } from 'fp-ts/IO'

import { doEffect } from './doEffect'
import { Effect, Pure } from './Effect'
import { memo } from './memo'

export const lazy = <E, A>(io: IO<Effect<E, A>>) => {
  const memoed = memo(Pure.fromIO(io))

  return doEffect(function* () {
    const eff = yield* memoed

    return yield* eff
  })
}
