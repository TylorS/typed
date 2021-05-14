import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { Fiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { resetIndex } from '@fp/hooks'
import { useStream } from '@fp/hooks/useStream'
import { patch } from '@fp/Patch'
import { createReferences } from '@fp/Ref'

import { raf } from './raf'

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const renderWhenIdle = <E, A, B>(env: E.Env<E, A>, initial: B) =>
  Do(function* (_) {
    const refs = createReferences()
    const main = pipe(
      resetIndex,
      F.usingFiberRefs,
      E.chain(() => env),
    )

    yield* _(
      useStream(refs.events, {
        event: (_, x) => {
          if (x.type === 'updated' || x.type === 'deleted') {
            hasBeenUpdated = true
          }
        },
      }),
    )

    let fiber: Fiber<A>
    let rendered: unknown
    let patched = initial
    let hasBeenUpdated = true

    while (true) {
      if (hasBeenUpdated) {
        hasBeenUpdated = false
        fiber = yield* _(F.fork(main, { refs }))
        rendered = yield* _(F.join(fiber))
        patched = yield* _(patch(patched, rendered))
      }

      yield* _(raf)
    }
  })
