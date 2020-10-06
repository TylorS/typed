import { Disposable, Handle, Time, Timer } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { ask, doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'

import { useDisposable } from '../core/exports'

export type TimerEnv = { readonly timer: Timer }

export const useInterval = (
  f: () => Disposable,
  ms: Time,
): Effect<TimerEnv & EnvOf<typeof useDisposable>, Disposable> => {
  const eff = doEffect(function* () {
    const { timer } = yield* ask<TimerEnv>()

    return yield* useDisposable((t, n) => interval(t, n, f), [timer, ms] as const)
  })

  return eff
}

function interval(timer: Timer, ms: Time, f: () => Disposable): Disposable {
  const handles: Array<Handle> = []
  const disposable = lazy()

  handles.push(timer.setTimer(() => !disposable.disposed && disposable.addDisposable(f()), ms))

  const dispose = () => handles.forEach((handle) => timer.clearTimer(handle))

  disposable.addDisposable({ dispose })

  return disposable
}
