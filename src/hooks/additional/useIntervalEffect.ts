import { Time } from '@most/types'
import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { delay } from '@typed/fp/fibers/exports'

import { useFiber } from './useFiber'

export function useIntervalEffect<Args extends ReadonlyArray<any>, E>(
  f: (...args: Args) => Effect<E, void>,
  ms: Time,
  deps: Args,
) {
  return useFiber((n, ...args) => intervalEffect(f(...args), n), [ms, ...deps] as const)
}

function intervalEffect<E>(fx: Effect<E, void>, ms: Time) {
  const eff = doEffect(function* () {
    while (true) {
      yield* delay(ms)
      yield* fx
    }
  })

  return eff
}
