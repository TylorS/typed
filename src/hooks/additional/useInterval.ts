import { disposeNone } from '@most/disposable'
import { periodic } from '@most/scheduler'
import { Disposable, Scheduler, Time, Timer } from '@most/types'
import { ask, doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { createCallbackTask, SchedulerEnv } from '@typed/fp/fibers/exports'

import { useDisposable } from '../core/exports'

export type TimerEnv = { readonly timer: Timer }

export const useInterval = (
  f: () => Disposable,
  ms: Time,
): Effect<SchedulerEnv & EnvOf<typeof useDisposable>, Disposable> => {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()

    return yield* useDisposable((s, n) => interval(s, n, f), [scheduler, ms] as const)
  })

  return eff
}

function interval(scheduler: Scheduler, ms: Time, f: () => Disposable): Disposable {
  let first = true

  return periodic(
    ms,
    createCallbackTask(() => (first ? ((first = false), disposeNone()) : f())),
    scheduler,
  )
}
