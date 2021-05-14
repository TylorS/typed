import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { resetIndex, useDisposable } from '@fp/hooks'
import { patch } from '@fp/Patch'
import { createReferences } from '@fp/Ref'
import { SchedulerEnv } from '@fp/Scheduler'
import { createSink } from '@fp/Stream'

import { raf } from './raf'

/**
 * Runs the provided effect anytime there are Ref updates and the browser has idle time to spare. It
 * will use the provided Patch instance to provide updates.
 */
export const renderOnRaf = <E, A, B>(env: E.Env<E, A>, initial: B) =>
  Do(function* (_) {
    const current = yield* _(F.getCurrentFiber)
    const refs = createReferences()
    const main = pipe(
      // Always reset hooks index before running
      resetIndex,
      F.usingFiberRefs,
      E.chain(() => env),
    )

    let fiber = yield* _(F.fork(main, { refs }))
    let rendered = yield* _(F.join(fiber))
    let patched = yield* _(patch(initial, rendered))
    let currentStatus = yield* _(() => current.status)
    let hasBeenUpdated = false

    const { scheduler } = yield* _(E.ask<SchedulerEnv>())

    yield* _(
      useDisposable(() =>
        refs.events.run(
          createSink({
            event: (_, x) => {
              if (x.type === 'updated' || x.type === 'deleted') {
                hasBeenUpdated = true
              }
            },
          }),
          scheduler,
        ),
      ),
    )

    while (!F.isTerminal(currentStatus)) {
      yield* _(raf)

      if (hasBeenUpdated) {
        hasBeenUpdated = false
        fiber = yield* _(F.fork(main, { refs }))
        rendered = yield* _(F.join(fiber))
        patched = yield* _(patch(patched, rendered))
        currentStatus = yield* _(() => current.status)
      }
    }
  })
