import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { RefEvent } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { Stream } from '@fp/Stream'

import { useBoolean } from './useBoolean'
import { useSink } from './useSink'
import { useStream } from './useStream'

export const useHasUpdated = (
  events: Stream<RefEvent<unknown>>,
): E.Env<F.CurrentFiber & SchedulerEnv, boolean> =>
  F.DoF(function* (_) {
    const [hasBeenUpdated, toggle] = yield* _(useBoolean(true))

    const sink = yield* _(
      useSink({
        event: (_, event: RefEvent<unknown>) =>
          event.type === 'created' ? E.of(void 0) : E.fromResume(toggle(true)),
      }),
    )

    yield* _(useStream(events, sink))

    return hasBeenUpdated
  })
