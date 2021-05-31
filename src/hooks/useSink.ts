import * as E from '@fp/Env'
import { CurrentFiber, DoF } from '@fp/Fiber'
import { exec } from '@fp/Resume'
import { Sink, Time } from '@most/types'
import { constant, flow } from 'fp-ts/function'

import { useMemo } from './useMemo'
import { useOp } from './useOp'

const constPure = constant(E.of(void 0))

export function useSink<A, E1, E2, E3>(
  sink: EnvSink<A, E1, E2, E3>,
): E.Env<CurrentFiber & E1 & E2 & E3, Sink<A>> {
  return DoF(function* (_) {
    const event_ = yield* _(useOp(sink.event ?? constPure))
    const error_ = yield* _(useOp(sink.error ?? constPure))
    const end_ = yield* _(useOp(sink.end ?? constPure))

    return yield* _(
      useMemo(
        E.fromIO(
          (): Sink<A> => ({
            event: flow(event_, exec),
            error: flow(error_, exec),
            end: flow(end_, exec),
          }),
        ),
      ),
    )
  })
}

export type EnvSink<A, E1, E2, E3> = {
  readonly event?: (time: Time, event: A) => E.Env<E1, any>
  readonly error?: (time: Time, error: Error) => E.Env<E2, any>
  readonly end?: (time: Time) => E.Env<E3, any>
}
