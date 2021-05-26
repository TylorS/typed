import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { CurrentFiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { liftEnv as _ } from '@fp/Fx/Env'
import * as H from '@fp/hooks'
import { useRef } from '@fp/hooks'
import { useSink } from '@fp/hooks/useSink'
import * as P from '@fp/Patch'
import { WrappedRef } from '@fp/Ref'
import * as R from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'
import { Eq, EqStrict } from 'fp-ts/Eq'
import { not } from 'fp-ts/Refinement'

import { Raf, raf } from './raf'

const refOf = <A>(value: A, eq?: Eq<A>) => _(useRef(E.of(value), eq))
const useHasBeenUpdatedRef = refOf(true)

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const useRenderOnRaf = <E, A, B, Deps extends readonly any[]>(
  env: E.Env<E, A>,
  initial: B,
  options?: H.UseFiberOptions<Deps> & { readonly patchedEq?: Eq<B> },
) =>
  F.DoF(function* () {
    const Patched = yield* refOf<B>(initial, options?.patchedEq ?? EqStrict)
    const HasBeenUpdated = yield* useHasBeenUpdatedRef

    yield* _(H.useFiber(renderOnRaf(env, Patched, HasBeenUpdated), options))

    return yield* _(Patched.get)
  })

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

    const sink = yield* _(useSink(HasBeenUpdated.set(true)))

    yield* _(H.useStream(fiber.refs.events, sink))

    while (yield* shouldContinue) {
      if (yield* shouldRender) {
        yield* _(raf)
        yield* isRendering

        const current = yield* _(Patched.get)
        const next = yield* _(main)
        const patched = yield* _(P.patch(current, next))

        yield* _(Patched.set(patched))
      }
    }

    return yield* _(Patched.get)
  })
