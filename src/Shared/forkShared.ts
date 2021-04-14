import * as E from '@fp/Env'
import {
  addDisposable,
  CurrentFiber,
  Fiber,
  Fork,
  fork,
  ForkOptions,
  isTerminal,
  Status,
} from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { GlobalRefs } from '@fp/Global'
import { createReferences, RefEvent } from '@fp/Ref'
import { runStream, SchedulerEnv } from '@fp/Scheduler'
import { createSink } from '@fp/Stream'
import { disposeBoth } from '@most/disposable'
import * as O from 'fp-ts/Option'

import { getSendSharedEvent } from './SharedEvents'
import { getSharedFiber, setSharedFiber } from './SharedFibers'
import { getSharedReference } from './SharedReferences'

export type ForkSharedOptions = Omit<ForkOptions, 'refs'> & {
  readonly key: object
  readonly abort?: boolean
}

/**
 * Creates a Fiber instance that inherits references from SharedReferences. A None is
 * returned if no fiber has been created, because there is a current fiber that already exists and has not completed.
 * A Some<Fiber<A>> is returned if there the previous fiber has been completed or there is not one.
 */
export function forkShared<E, A>(
  env: E.Env<E, A>,
  options: ForkSharedOptions,
): E.Env<E & GlobalRefs & Fork & SchedulerEnv, O.Option<Fiber<A>>> {
  const { key, abort = true, ...forkOptions } = options

  return Do(function* (_) {
    const currentFiber = yield* _(getSharedFiber(key))

    // Don't create a new fiber if there is a non-terminal fiber that currently exists
    if (O.isSome(currentFiber) && !isTerminal(yield* _(() => currentFiber.value.status))) {
      if (abort) {
        // Abort the current fiber
        yield* _((_: unknown) => currentFiber.value.abort)
      }

      return O.none
    }

    const currentReferences = yield* _(getSharedReference(key))
    const refs = pipe(
      currentReferences,
      O.getOrElse(() => createReferences()),
    )

    const fiber = yield* _(fork(env, { ...forkOptions, refs }))

    // Set the Fiber
    yield* _(setSharedFiber(key, fiber))
    // Listen to events and replicate them to SharedEvents with the associated Key
    yield* _(replicateFiberEvents(key, fiber))

    return O.some(fiber)
  })
}

const replicateFiberEvents = <A>(key: object, fiber: Fiber<A>) =>
  pipe(
    Do(function* (_) {
      const sendEvent = yield* _(getSendSharedEvent)

      const statusEventDisposable = yield* _(
        runStream(
          createSink<Status<A>>({
            event: (_, status) => sendEvent({ type: 'shared/status', key, fiber, status }),
          }),
          fiber.statusEvents,
        ),
      )

      const refEventDisposable = yield* _(
        runStream(
          createSink<RefEvent<unknown>>({
            event: (_, event) => sendEvent({ type: 'shared/ref', key, fiber, event }),
          }),
          fiber.refs.events,
        ),
      )

      yield* _(
        addDisposable(disposeBoth(statusEventDisposable, refEventDisposable), {
          onComplete: true,
        }),
      )
    }),
    E.useSome<CurrentFiber>({ currentFiber: fiber }),
  )
