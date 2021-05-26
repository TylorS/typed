import * as E from '@fp/Env'
import { CurrentFiber, DoF } from '@fp/Fiber'
import { ask } from '@fp/Fx/Env'
import { exec } from '@fp/Resume'
import { Sink, Time } from '@most/types'
import { pipe } from 'fp-ts/function'

import { useMemo } from './useMemo'
import { useMutableRef } from './useMutableRef'

const constPure = E.of(void 0)

/**
 * Helps you create a stable reference to a Sink object using Env to execute effects
 */
export function useSink<A>(
  event?:
    | E.Env<CurrentTime, any>
    | E.Env<StreamEvent<A>, any>
    | E.Env<CurrentTime & StreamEvent<A>, any>,
  error?: E.Env<CurrentTime, any> | E.Env<StreamError, any> | E.Env<CurrentTime & StreamError, any>,
  end?: E.Env<CurrentTime, any>,
): E.Env<CurrentFiber, Sink<A>>

export function useSink<A, E1, E2, E3>(
  event?:
    | E.Env<E1, any>
    | E.Env<E1 & CurrentTime, any>
    | E.Env<E1 & StreamEvent<A>, any>
    | E.Env<E1 & CurrentTime & StreamEvent<A>, any>,
  error?:
    | E.Env<E2, any>
    | E.Env<E2 & CurrentTime, any>
    | E.Env<E2 & StreamError, any>
    | E.Env<E2 & CurrentTime & StreamError, any>,
  end?: E.Env<E3, any> | E.Env<E3 & CurrentTime, any>,
): E.Env<CurrentFiber & E1 & E2 & E3, Sink<A>>

export function useSink<A, E1, E2, E3>(
  event: E.Env<E1 & CurrentTime & StreamEvent<A>, any> = constPure,
  error: E.Env<E2 & CurrentTime & StreamError, any> = constPure,
  end: E.Env<E3 & CurrentTime, any> = constPure,
): E.Env<CurrentFiber & E1 & E2 & E3, Sink<A>> {
  return DoF(function* (_) {
    const env = yield* ask<E1 & E2 & E3>()
    const event_ = yield* _(useMutableRef(E.fromIO(() => event)))
    event_.current = event
    const error_ = yield* _(useMutableRef(E.fromIO(() => error)))
    error_.current = error
    const end_ = yield* _(useMutableRef(E.fromIO(() => end)))
    end_.current = end

    // TODO: Should there be a way to track all of the disposables created in this Sink?
    const sink: Sink<A> = yield* _(
      useMemo(
        E.fromIO(() => ({
          event: (t, x) =>
            pipe(
              { ...env, time: t, streamEvent: x } as E1 & CurrentTime & StreamEvent<A>,
              event_.current,
              exec,
            ),
          error: (t, e) =>
            pipe(
              { ...env, time: t, streamError: e } as E2 & CurrentTime & StreamError,
              error_.current,
              exec,
            ),
          end: (t) => pipe({ ...env, time: t } as E3 & CurrentTime, end_.current, exec),
        })),
      ),
    )

    return sink
  })
}

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
