import { settable } from '@fp/Disposable'
import { Env, provideSome } from '@fp/Env'
import { References } from '@fp/Ref'
import * as R from '@fp/Resume'
import { Scheduler } from '@most/types'
import { Either, left, right } from 'fp-ts/Either'
import { constVoid, pipe } from 'fp-ts/function'
import { fromNullable, isSome, match, none, Option, some } from 'fp-ts/Option'

import { CurrentFiber, Fiber, Fork, Join, Kill } from '../Fiber'
import { Status } from '../Status'
import { createFiber } from './createFiber'
import { addChild } from './FiberChildren'

export function createRuntime(scheduler: Scheduler): Fork & Join & Kill {
  const Fork: Fork = {
    forkFiber: <R, A>(env: Env<R, A>, r: R, refs?: References) =>
      pipe(
        R.sync(() =>
          createFiber(
            pipe(env, provideSome(r)),
            fromNullable((r as Partial<CurrentFiber>).currentFiber),
            scheduler,
            refs,
          ),
        ),
        R.chain(addChildToParent),
      ),
  }

  const Join: Join = {
    joinFiber: (fiber) => joinFiber(fiber, scheduler),
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

function joinFiber<A>(fiber: Fiber<A>, scheduler: Scheduler): R.Resume<Either<Error, A>> {
  return pipe(
    fiber.status,
    R.map(handleStatus),
    R.chain((currentStatus) => {
      if (isSome(currentStatus)) {
        return R.of(currentStatus.value)
      }

      return R.async((resume) => {
        const disposable = settable()
        const streamDisposable = fiber.statusEvents[1].run(
          {
            event: (_, status) =>
              pipe(
                status,
                handleStatus,
                match(constVoid, (e) => {
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

function handleStatus<A>(status: Status<A>): Option<Either<Error, A>> {
  if (status.type === 'completed') {
    return pipe(status.value, some)
  }

  if (status.type === 'finished') {
    return pipe(status.value, right, some)
  }

  if (status.type === 'failed') {
    return pipe(status.error, left, some)
  }

  if (status.type === 'aborted') {
    return pipe(new Error('Aborted'), left, some)
  }

  return none
}

function addChildToParent<A>(fiber: Fiber<A>) {
  return pipe(
    fiber.parent,
    match(
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
