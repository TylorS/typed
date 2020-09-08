import { filter, take } from '@most/core'
import { Disposable, Scheduler, Stream } from '@most/types'
import { Arity1 } from '@typed/fp/common'
import { lazy } from '@typed/fp/Disposable'
import { ask, async, doEffect, Effect, fromEnv } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { pipe } from 'fp-ts/es6/function'
import { constVoid } from 'fp-ts/es6/function'

import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
import { isResponse } from './Response'

export const waitForResponse = <A extends JsonRpc.Response>(
  requestId: JsonRpc.Id,
  direction: MessageDirection,
): Effect<ConnectionEnv & SchedulerEnv, A> => {
  const eff = doEffect(function* () {
    const { connection } = yield* ask<ConnectionEnv>()
    const [, messages] = connection[direction]
    const response = yield* pipe(
      messages,
      filter(isResponse),
      filter((r): r is A => r.id === requestId),
      takeOne,
    )

    return response
  })

  return eff
}

function takeOne<A>(stream: Stream<A>): Effect<SchedulerEnv, A> {
  return fromEnv((e) => async((resume) => pipe(stream, take(1), resumeStream(e.scheduler, resume))))
}

function resumeStream<A>(scheduler: Scheduler, resume: Arity1<A, Disposable>) {
  return (stream: Stream<A>): Disposable => {
    const disposable = lazy()

    disposable.addDisposable(
      stream.run(
        {
          event(_, x) {
            disposable.addDisposable(resume(x))
          },
          error: constVoid,
          end: constVoid,
        },
        scheduler,
      ),
    )

    return disposable
  }
}
