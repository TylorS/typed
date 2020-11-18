import { disposeNone } from '@most/disposable'
import { asap } from '@most/scheduler'
import { Disposable, Scheduler } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { Effect, map, race, toEnv } from '@typed/fp/Effect/exports'
import { provideSome, useSome } from '@typed/fp/Effect/provide'
import { runPure } from '@typed/fp/Effect/runEffect'
import {
  awaitCompleted,
  awaitFailed,
  awaitPaused,
  awaitSuccess,
  Fiber,
  FiberState,
  foldFiberInfo,
} from '@typed/fp/Fiber/Fiber'
import { FiberEnv } from '@typed/fp/Fiber/FiberEnv'
import { async, Resume, sync } from '@typed/fp/Resume/exports'
import { createCallbackTask } from '@typed/fp/Scheduler/exports'
import { Either, left, right } from 'fp-ts/Either'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { newIORef } from 'fp-ts/IORef'
import { fold, isNone, isSome, none, Option, some } from 'fp-ts/Option'

import { createFiberManager } from './FiberManager'
import { createInfoChangeManager } from './InfoChangeManager'

export function createFiber<A>(
  effect: Effect<FiberEnv, A>,
  scheduler: Scheduler,
  parentFiber: Option<Fiber<unknown>> = none,
): Fiber<A> {
  const infoChangeManager = createInfoChangeManager<A>(scheduler)
  const fiberManager = createFiberManager(onFinish)
  const exitValueRef = newIORef<Option<A>>(none)()
  const fiber: Fiber<A> = lazy({
    parentFiber,
    children: fiberManager.fibers,
    getInfo: infoChangeManager.getInfo,
    onInfoChange: infoChangeManager.onInfoChange,
    setPaused: infoChangeManager.setPaused,
    addChildFiber: fiberManager.addFiber,
    pauseChildFiber: fiberManager.pauseFiber,
    runChildFiber: fiberManager.runChildFiber,
  })

  if (isSome(parentFiber)) {
    fiber.addDisposable(parentFiber.value.addChildFiber(fiber))
  }

  fiber.addDisposable(infoChangeManager)
  fiber.addDisposable(fiberManager)
  // Use scheduler to ensure fiber has a chance to return before executing
  fiber.addDisposable(asap(createCallbackTask(runFiber, onError), scheduler))

  return fiber

  // Fork out a fiber
  function runFiber(): Disposable {
    try {
      infoChangeManager.updateInfo({ state: FiberState.Running })

      return pipe(effect, useSome(createFiberEnv(fiber, scheduler)), runPure(onEffectCompletion))
    } catch (error) {
      onError(error)

      return disposeNone()
    }
  }

  function onEffectCompletion(value: A): Disposable {
    exitValueRef.write(some(value))()

    onFinish()

    return disposeNone()
  }

  function onFinish(): void {
    const exitValue = exitValueRef.read()

    if (isNone(exitValue)) {
      return
    }

    if (fiberManager.fibers.size > 0) {
      infoChangeManager.updateInfo({ state: FiberState.Success, value: exitValue.value })

      return
    }

    infoChangeManager.updateInfo({ state: FiberState.Completed, value: exitValue.value })

    // Cleanup all resources
    fiber.dispose()
  }

  function onError(error: Error): void {
    infoChangeManager.updateInfo({ state: FiberState.Failed, error })

    // Cleanup all resources
    fiber.dispose()
  }
}

function createFiberEnv(currentFiber: Fiber<unknown>, scheduler: Scheduler): FiberEnv {
  return {
    currentFiber,
    scheduler,
    join: joinFiber,
    kill: killFiber,
    fork: (eff, e) =>
      pipe(eff, provideSome(e), createFiberWith(scheduler, some(currentFiber)), sync),
    pause: async<void>((resume) =>
      pipe(
        currentFiber.parentFiber,
        fold(
          () =>
            asap(
              createCallbackTask(() => resume()),
              scheduler,
            ),
          (parent) => parent.pauseChildFiber(currentFiber, () => resume()),
        ),
      ),
    ),
    proceed: (fiber) => {
      const { state } = fiber.getInfo()

      if (state === FiberState.Queued) {
        return pipe(
          fiber,
          awaitPaused,
          race(awaitFailed(fiber)),
          race(awaitSuccess(fiber)),
          race(awaitCompleted(fiber)),
          map(constVoid),
          toEnv,
        )({})
      }

      return async<void>((resume) => currentFiber.runChildFiber(fiber, () => resume()))
    },
  }
}

function createFiberWith(scheduler: Scheduler, parentFiber: Option<Fiber<unknown>>) {
  return <A>(effect: Effect<FiberEnv, A>) => createFiber(effect, scheduler, parentFiber)
}

function joinFiber<A>(fiber: Fiber<A>): Resume<Either<Error, A>> {
  return async((cb) =>
    fiber.onInfoChange(
      foldFiberInfo(
        disposeNone,
        disposeNone,
        disposeNone,
        flow(left, cb),
        flow(right, cb),
        flow(right, cb),
      ),
    ),
  )
}

function killFiber<A>(fiber: Fiber<A>): Resume<void> {
  return sync(fiber.dispose())
}
