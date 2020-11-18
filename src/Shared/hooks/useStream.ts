import { Disposable, Stream } from '@most/types'
import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'
import { SharedEnv } from '@typed/fp/Shared/core/exports'
import { constVoid } from 'fp-ts/function'

import { useDisposable } from './useDisposable'

export function useStream<A>(
  stream: Stream<A>,
  onValue: (value: A) => void,
): Effect<SharedEnv & SchedulerEnv, Disposable> {
  const eff = doEffect(function* () {
    const { scheduler } = yield* ask<SchedulerEnv>()

    return yield* useDisposable(
      () =>
        stream.run(
          { event: (_, value) => onValue(value), error: constVoid, end: constVoid },
          scheduler,
        ),
      [stream, scheduler],
    )
  })

  return eff
}
