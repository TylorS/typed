import { Time } from '@most/types'
import { Effect } from '@typed/fp/Effect/Effect'
import { ask, doEffect, execPure, use } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { useInterval } from './useInterval'

export function useIntervalEffect<E>(f: () => Effect<E, any>, ms: Time) {
  const eff = doEffect(function* () {
    const env = yield* ask<E>()

    return yield* useInterval(() => pipe(f(), use(env), execPure), ms)
  })

  return eff
}
