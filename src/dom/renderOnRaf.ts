import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { liftEnv as _ } from '@fp/Fx/Env'
import * as H from '@fp/hooks'
import * as P from '@fp/Patch'
import { WrappedRef } from '@fp/Ref'
import * as R from '@fp/Resume'
import { not } from 'fp-ts/Refinement'

import { raf } from './raf'

const useHasBeenUpdatedRef = _(H.useRef(E.of(true)))
const usePatchedRef = <A>(initial: A) => _(H.useRef(E.of(initial)))

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const useRenderOnRaf = <E, A, B, Deps extends readonly any[]>(
  env: E.Env<E, A>,
  initial: B,
  options?: H.UseFiberOptions<Deps>,
) =>
  F.DoF(function* () {
    const Patched = yield* usePatchedRef<B>(initial)
    const HasBeenUpdated = yield* useHasBeenUpdatedRef
    const fiber: F.Fiber<B> = yield* _(
      H.useFiber(renderOnRaf(env, Patched, HasBeenUpdated), options),
    )

    yield* _(
      H.useStream(fiber.refs.events, {
        event: yield* _(H.useMemo(E.fromIO(() => HasBeenUpdated.set(true)))),
      }),
    )

    return yield* _(Patched.get)
  })

export const renderOnRaf = <E1, A, E2, E3, B, E4, E5>(
  main: E.Env<E1, A>,
  Patched: WrappedRef<E2, E3, B>,
  HasBeenUpdated: WrappedRef<E4, E5, boolean>,
) =>
  F.DoF(function* (_) {
    const fiber = yield* _(F.getCurrentFiber)
    const shouldContinue = _(() => pipe(fiber.status, R.map(not(F.isTerminal))))
    const shouldRender = _(HasBeenUpdated.get)
    const isRendering = _(HasBeenUpdated.set(false))

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
