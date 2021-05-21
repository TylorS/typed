import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { liftEnv as _ } from '@fp/Fx/Env'
import { resetIndex, useFiber, useMemo, useRef, useStream } from '@fp/hooks'
import * as P from '@fp/Patch'
import { createReferences, RefEvent } from '@fp/Ref'
import { exec } from '@fp/Resume'
import { createSink } from '@fp/Stream'

import * as R from './raf'

const raf = _(R.raf)

/**
 * Runs the provided effect anytime there are Ref updates, and will use the provided Patch instance
 * to provide updates.
 */
export const renderOnRaf = <E, A, B>(env: E.Env<E, A>, initial: B, options: F.ForkOptions = {}) =>
  F.DoF(function* () {
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

    const sink = yield* _(
      useMemo(
        E.fromIO(() =>
          createSink({
            event: (_, event: RefEvent<unknown>) => {
              if (event.type !== 'created') {
                pipe({}, HasBeenUpdated.set(true), exec)
              }
            },
          }),
        ),
      ),
    )

    yield* _(useStream(refs.events, sink))

    yield* _(
      useFiber(
        F.DoF(function* () {
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

              const current = yield* _(Patched.get)
              const next = yield* _(main)
              const patched = yield* _(P.patch(current, next))

              yield* _(Patched.set(patched))
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
