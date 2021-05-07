import { settable } from '@fp/Disposable'
import { Env, provideSome } from '@fp/Env'
import * as R from '@fp/Resume'
import { disposeNone } from '@most/disposable'
import { Scheduler } from '@most/types'
import * as Ei from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { CurrentFiber, Fiber, Fork, ForkOptions, Join, Kill } from '../Fiber'
import { Status } from '../Status'
import { createFiber } from './createFiber'
import { addChild } from './FiberChildren'
import { changeStatus } from './internal/changeStatus'

export function createRuntime(scheduler: Scheduler): Fork & Join & Kill {
  const Fork: Fork = {
    forkFiber: <R, A>(env: Env<R, A>, r: R, options: ForkOptions = {}) =>
      pipe(
        R.sync(() =>
          createFiber(pipe(env, provideSome(r)), {
            parent: (r as Partial<CurrentFiber>).currentFiber,
            scheduler,
            ...options,
          }),
        ),
        R.chain(addChildToParent),
      ),
  }

  const Join: Join = {
    joinFiber: (fiber) =>
      pipe(
        fiber.parent,
        O.matchW(
          () => {
            throw new Error(`Unable to join Fiber with no parent`)
          },
          (parentFiber) =>
            pipe(
              joinFiber(fiber, scheduler),
              R.chain(
                Ei.matchW(
                  (status) =>
                    pipe(
                      // Have parent fiber adopt the status of the child and stop
                      {
                        currentFiber: parentFiber,
                      },
                      changeStatus(status),
                      R.chain(() => R.async<never>(() => disposeNone())),
                    ),
                  R.of,
                ),
              ),
            ),
        ),
      ),
  }

  const Kill: Kill = {
    killFiber: (fiber) => fiber.abort,
  }

  return {
    ...Fork,
    ...Join,
    ...Kill,
  }
}

function joinFiber<A>(fiber: Fiber<A>, scheduler: Scheduler): R.Resume<Ei.Either<Status<A>, A>> {
  return pipe(
    fiber.status,
    R.map(handleStatus),
    R.chain((currentStatus) => {
      if (O.isSome(currentStatus)) {
        return R.of(currentStatus.value)
      }

      return R.async((resume) => {
        const disposable = settable()
        const streamDisposable = fiber.statusEvents.run(
          {
            event: (_, status) =>
              pipe(
                status,
                handleStatus,
                O.match(constVoid, (e) => {
                  streamDisposable.dispose()
                  disposable.addDisposable(resume(e))
                }),
              ),
            error: constVoid,
            end: constVoid,
          },
          scheduler,
        )

        disposable.addDisposable(streamDisposable)

        return disposable
      })
    }),
  )
}

function handleStatus<A>(status: Status<A>): O.Option<Ei.Either<Status<A>, A>> {
  if (status.type === 'completed') {
    return pipe(
      status.value,
      Ei.mapLeft(() => status),
      O.some,
    )
  }

  if (status.type === 'finished') {
    return pipe(status.value, Ei.right, O.some)
  }

  if (status.type === 'failed') {
    return pipe(status, Ei.left, O.some)
  }

  if (status.type === 'aborted') {
    return pipe(status, Ei.left, O.some)
  }

  return O.none
}

function addChildToParent<A>(fiber: Fiber<A>) {
  return pipe(
    fiber.parent,
    O.match(
      () => R.of(fiber),
      (parent) =>
        pipe(
          { currentFiber: parent },
          addChild(fiber),
          R.map(() => fiber),
        ),
    ),
  )
}
