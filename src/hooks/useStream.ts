import * as E from '@fp/Env'
import { DoF } from '@fp/Fiber'
import { SchedulerEnv } from '@fp/Scheduler'
import { Sink, Stream } from '@most/types'

import { useDisposable } from './useDisposable'
import { useMutableRef } from './useMutableRef'

export const useStream = <A>(stream: Stream<A>, sink: Sink<A>) =>
  DoF(function* (_) {
    const e = yield* _(E.ask<SchedulerEnv>())
    const sink_ = yield* _(useMutableRef(E.of(sink)))

    sink_.current = sink

    return yield* _(
      useDisposable(
        () =>
          stream.run(
            {
              event: (t, x) => sink_.current.event(t, x),
              error: (t, e) => sink_.current.error(t, e),
              end: (t) => sink_.current.end(t),
            },
            e.scheduler,
          ),
        [stream],
      ),
    )
  })
