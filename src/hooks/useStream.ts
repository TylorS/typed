import { DoF } from '@fp/Fiber'
import { SchedulerEnv } from '@fp/Scheduler'
import { Sink, Stream, Time } from '@most/types'
import { EqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import * as E from '../Env'
import { useDisposable } from './useDisposable'
import { useMemo } from './useMemo'

const constPure = E.of(void 0)

const eqStricts = [EqStrict, EqStrict, EqStrict] as const

export const useStream = <A, E1, E2, E3>(
  stream: Stream<A>,
  sink: Partial<EnvSink<A, E1, E2, E3>> = {},
) =>
  DoF(function* (_) {
    const e = yield* _(E.ask<SchedulerEnv & E1 & E2 & E3>())
    const sink_ = yield* _(
      useMemo(
        E.fromIO(
          (): Sink<A> => ({
            event: (time, value) =>
              pipe(sink.event ?? constPure, E.execWith({ ...e, time, streamEvent: value })),
            error: (time, error) =>
              pipe(sink.error ?? constPure, E.execWith({ ...e, time, streamError: error })),
            end: (time) => pipe(sink.end ?? constPure, E.execWith({ ...e, time })),
          }),
        ),
        [sink.event, sink.error, sink.end],
        eqStricts,
      ),
    )

    return yield* _(useDisposable(() => stream.run(sink_, e.scheduler), [stream, sink_]))
  })

export type StreamEvent<A> = {
  readonly streamEvent: A
}

export const withEvent = <A, E, B>(f: (value: A) => E.Env<E, B>) =>
  E.asksE((e: StreamEvent<A>) => f(e.streamEvent))

export type StreamError = {
  readonly streamError: Error
}

export const withError = <A, E, B>(f: (value: A) => E.Env<E, B>) =>
  E.asksE((e: StreamEvent<A>) => f(e.streamEvent))

export type CurrentTime = {
  readonly time: Time
}

export const getStreamTime = E.asks((e: CurrentTime) => e.time)

export type EnvSink<A, E1, E2, E3> = {
  readonly event: E.Env<E1, unknown> | E.Env<E1 & CurrentTime & StreamEvent<A>, unknown>
  readonly error: E.Env<E2, unknown> | E.Env<E2 & CurrentTime & StreamError, unknown>
  readonly end: E.Env<E3, unknown> | E.Env<E3 & CurrentTime, unknown>
}
