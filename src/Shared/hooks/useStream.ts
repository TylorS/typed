import { ask, doEffect, Effect } from '@fp/Effect/exports'
import { SchedulerEnv } from '@fp/Scheduler/exports'
import { SharedEnv } from '@fp/Shared/core/exports'
import { Disposable, Stream } from '@most/types'
import { constVoid } from 'fp-ts/function'

import { useDisposable } from './useDisposable'

/**
 * Subscribe to the events contained within a Stream.
 */
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
