import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { Fiber, ForkOptions } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { resetIndex, useStream } from '@fp/hooks'
import { patch } from '@fp/Patch'
import { createReferences } from '@fp/Ref'

import { raf } from './raf'

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const renderOnRaf = <E, A, B>(env: E.Env<E, A>, initial: B, options: ForkOptions = {}) =>
  Do(function* (_) {
    const { refs = createReferences(), id = Symbol(`RenderOnRaf::Main`) } = options
    const main = pipe(
      resetIndex,
      E.chain(() => env),
      F.usingFiberRefs,
    )
    const fork_ = _(F.fork(main, { refs, id }))

    let fiber: Fiber<A>
    let rendered: A
    let patched = initial
    let hasBeenUpdated = true

    yield* _(
      useStream(refs.events, {
        event: (_, event) => {
          if (event.type !== 'created') {
            hasBeenUpdated = true
          }
        },
      }),
    )

    while (true) {
      if (hasBeenUpdated) {
        hasBeenUpdated = false
        fiber = yield* fork_
        rendered = yield* _(F.join(fiber))
        patched = yield* _(patch(patched, rendered))
      }

      yield* _(raf)
    }
  })
