import { Disposable, Time } from '@most/types'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { ask, doEffect, execPure, useAll } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { useInterval } from './useInterval'

export function useIntervalEffect<E>(
  f: () => Effect<E, any>,
  ms: Time,
): Effect<E & EnvOf<typeof useInterval>, Disposable> {
  const eff = doEffect(function* () {
    const env = yield* ask<E>()
    const d: Disposable = yield* useInterval(() => pipe(useAll(env, f()), execPure), ms)

    return d
  })

  return eff
}
