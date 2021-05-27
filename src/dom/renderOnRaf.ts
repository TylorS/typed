import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { CurrentFiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import * as H from '@fp/hooks'
import { useSink } from '@fp/hooks/useSink'
import * as P from '@fp/Patch'
import { RefEvent, WrappedRef } from '@fp/Ref'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { not } from 'fp-ts/Refinement'

import { Raf, raf } from './raf'

export const renderOnRaf = <E1, A, E2, E3, B, E4, E5>(
  main: E.Env<E1, A>,
  Patched: WrappedRef<E2, E3, B>,
  HasBeenUpdated: WrappedRef<E4, E5, boolean>,
): E.Env<CurrentFiber & SchedulerEnv & Raf & P.Patch<B, A> & E1 & E2 & E3 & E4 & E5, B> =>
  F.DoF(function* (_) {
    const fiber = yield* _(F.getCurrentFiber)
    const shouldContinue = _(() => pipe(fiber.status, R.map(not(F.isTerminal))))
    const shouldRender = _(HasBeenUpdated.get)
    const isRendering = _(HasBeenUpdated.set(false))
    const sink = yield* _(
      useSink((_, event: RefEvent<unknown>) =>
        HasBeenUpdated.modify((b) => (event.type === 'created' ? b : true)),
      ),
    )

    yield* _(H.useStream(fiber.refs.events, sink))

    while (yield* shouldContinue) {
      if (yield* shouldRender) {
        yield* isRendering

        const next = yield* _(main)
        const current = yield* _(Patched.get)
        const patched = yield* _(P.patch(current, next))

        yield* _(Patched.set(patched))
      }

      yield* _(raf)
    }

    return yield* _(Patched.get)
  })
