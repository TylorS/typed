import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { CurrentFiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { liftEnv } from '@fp/Fx/Env'
import { resetIndex, useFiber, useMemo, useRef, useStream } from '@fp/hooks'
import * as P from '@fp/Patch'
import { createReferences } from '@fp/Ref'
import { exec } from '@fp/Resume'
import { SchedulerEnv } from '@fp/Scheduler'

import * as R from './raf'

const raf = liftEnv(R.raf)

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const renderOnRaf = <E, A, B>(
  env:
    | E.Env<E, A>
    | E.Env<E & CurrentFiber, A>
    | E.Env<E & SchedulerEnv, A>
    | E.Env<E & CurrentFiber & SchedulerEnv, A>,
  initial: B,
  options: F.ForkOptions = {},
) =>
  F.DoF(function* (_) {
    const refs = yield* _(
      useMemo(
        E.fromIO(() => options.refs ?? createReferences()),
        [options.refs],
      ),
    )

    const id = yield* _(
      useMemo(
        E.fromIO(() => options.id ?? Symbol(`RenderOnRaf::Main`)),
        [options.id],
      ),
    )

    const Patched = yield* _(useRef(E.of(initial)))
    const HasBeenUpdated = yield* _(useRef(E.of(true)))

    yield* _(
      useStream(refs.events, {
        event: (_, event) => {
          if (event.type !== 'created') {
            pipe({}, HasBeenUpdated.set(true), exec)
          }
        },
      }),
    )

    yield* _(
      useFiber(
        F.DoF(function* (_) {
          const main = F.forkJoin(
            pipe(
              resetIndex,
              E.chain(() => env),
              F.usingFiberRefs,
            ),
            { refs, id },
          )

          while (true) {
            if (yield* _(HasBeenUpdated.get)) {
              yield* _(HasBeenUpdated.set(false))

              const previous = yield* _(Patched.get)
              const current = yield* _(main)
              const next = yield* _(P.patch(previous, current))

              yield* _(Patched.set(next))
            }

            yield* raf
          }
        }),
        {
          deps: [refs, id],
        },
      ),
    )

    return yield* _(Patched.get)
  })
