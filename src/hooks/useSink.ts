import * as E from '@fp/Env'
import { CurrentFiber, DoF } from '@fp/Fiber'
import { exec } from '@fp/Resume'
import { Sink, Time } from '@most/types'
import { constant, flow } from 'fp-ts/function'

import { useMemo } from './useMemo'
import { useOp } from './useOp'

const constPure = constant(E.of(void 0))

export function useSink<A, E1, E2, E3>(
  event: (time: Time, event: A) => E.Env<E1, any> = constPure,
  error: (time: Time, error: Error) => E.Env<E2, any> = constPure,
  end: (time: Time) => E.Env<E3, any> = constPure,
): E.Env<CurrentFiber & E1 & E2 & E3, Sink<A>> {
  return DoF(function* (_) {
    const event_ = yield* _(useOp(event))
    const error_ = yield* _(useOp(error))
    const end_ = yield* _(useOp(end))

    // TODO: Should there be a way to track all of the disposables created in this Sink?
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
