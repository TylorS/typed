import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import * as H from '@fp/hooks'
import * as P from '@fp/Patch'
import * as R from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'

import { raf } from './raf'
import { whenIdle } from './whenIdle'

export const usePatchOnRaf = <E1, A, B>(main: E.Env<E1, A>, initial: B) =>
  F.DoF(function* (_) {
    const Patched = yield* pipe(initial, E.of, H.useRef, _)

    yield* pipe(patchOnRaf(main, Patched), H.useFiber, _)

    return yield* _(Patched.get)
  })

export const usePatchWhenIdle = <E1, A, B>(main: E.Env<E1, A>, initial: B) =>
  F.DoF(function* (_) {
    const Patched = yield* pipe(initial, E.of, H.useRef, _)

    yield* pipe(patchWhenIdle(main, Patched), H.useFiber, _)

    return yield* _(Patched.get)
  })

type ReplaceRefs<A> = A extends R.Refs & infer R ? R : A

export const patchWhen =
  <E4>(when: E.Env<E4, boolean>) =>
  <E1, A, E2, E3, B>(
    main: E.Env<E1, A>,
    Patched: R.WrappedRef<E2, E3, B>,
  ): E.Env<
    ReplaceRefs<E1 & E2 & E3 & E4> &
      F.Fork &
      F.Join &
      F.CurrentFiber &
      SchedulerEnv &
      P.Patch<B, A>,
    never
  > =>
    F.forever(
      F.DoF(function* (_) {
        const refs = yield* pipe(R.createReferences, E.fromIO, H.useMemo, _)
        const shouldRender = yield* pipe(refs.events, H.useHasUpdated, _)
        const current = yield* _(Patched.get)

        if (shouldRender) {
          const isReady = yield* _(when)

          if (!isReady) {
            return
          }

          const next = yield* _(F.forkJoin(main, { refs, withRefs: H.resetIndex }))
          const patched = yield* _(P.patch(current, next))

          yield* _(Patched.set(patched))
        }
      }),
      {
        inheritRefs: true,
        withRefs: H.resetIndex,
      },
    ) as E.Env<
      ReplaceRefs<E1 & E2 & E3 & E4> &
        F.Fork &
        F.Join &
        F.CurrentFiber &
        SchedulerEnv &
        P.Patch<B, A>,
      never
    >

export const patchOnRaf = pipe(raf, E.constant(true), patchWhen)

export const patchWhenIdle = pipe(
  whenIdle(),
  E.map((d) => d.timeRemaining() > 0),
  patchWhen,
)
