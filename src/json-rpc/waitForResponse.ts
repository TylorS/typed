import { filter, take } from '@most/core'
import { Disposable, Scheduler, Stream } from '@most/types'
import { pipe } from 'fp-ts/es6/function'
import { constVoid } from 'fp-ts/lib/function'

import { Arity1 } from '../common'
import { lazy } from '../Disposable'
import { ask, async, doEffect, Effect, fromEnv } from '../Effect'
import { SchedulerEnv } from '../fibers'
import { ConnectionEnv } from './Connection'
import { JsonRpc } from './json-rpc-v2'
import { MessageDirection } from './MessageDirection'
import { isResponse } from './Response'

export const waitForResponse = <A extends JsonRpc.Response<never, number, never>>(
  requestId: JsonRpc.Id,
  direction: MessageDirection,
): Effect<ConnectionEnv & SchedulerEnv, A> =>
  doEffect(function* () {
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
