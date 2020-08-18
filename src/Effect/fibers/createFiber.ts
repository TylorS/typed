import { disposeNone } from '@most/disposable'
import { asap } from '@most/scheduler'
import { Disposable, Scheduler } from '@most/types'
import { lazy } from '@typed/fp/Disposable'
import { async, Effect, Resume, sync } from '@typed/fp/Effect/Effect'
import { Fiber, FiberState, foldFiberInfo } from '@typed/fp/Effect/fibers/Fiber'
import { FiberEnv } from '@typed/fp/Effect/fibers/FiberEnv'
import { use } from '@typed/fp/Effect/provide'
import { runPure } from '@typed/fp/Effect/runEffect'
import { createCallbackTask } from '@typed/fp/Effect/SchedulerEnv'
import { Either, left, right } from 'fp-ts/es6/Either'
import { flow, pipe } from 'fp-ts/es6/function'
import { newIORef } from 'fp-ts/es6/IORef'
import { isNone, isSome, none, Option, some } from 'fp-ts/es6/Option'

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
    getInfo: infoChangeManager.getInfo,
    onInfoChange: infoChangeManager.onInfoChange,
    addChildFiber: fiberManager.addFiber,
  })

  if (isSome(parentFiber)) {
    fiber.addDisposable(parentFiber.value.addChildFiber(fiber))
  }

  // Use scheduler to ensure fiber has a chance to return before executing
  fiber.addDisposable(asap(createCallbackTask(runFiber), scheduler))
  fiber.addDisposable(infoChangeManager)
  fiber.addDisposable(fiberManager)

  return fiber

  // Fork out a fiber
  function runFiber(): Disposable {
    try {
      infoChangeManager.updateInfo({ state: FiberState.Running })

      return pipe(effect, use(createFiberEnv(fiber, scheduler)), runPure(onEffectCompletion))
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

    if (fiberManager.hasRemainingFibers()) {
      return infoChangeManager.updateInfo({ state: FiberState.Success, value: exitValue.value })
    }

    infoChangeManager.updateInfo({ state: FiberState.Completed, value: exitValue.value })

    // Cleeanup all resources
    fiber.dispose()
  }

  function onError(error: Error): void {
    infoChangeManager.updateInfo({ state: FiberState.Failed, error })

    // Cleeanup all resources
    fiber.dispose()
  }
}

function createFiberEnv(currentFiber: Fiber<unknown>, scheduler: Scheduler): FiberEnv {
  return {
    currentFiber,
    scheduler,
    join: joinFiber,
    kill: killFiber,
    fork: (eff, e) => pipe(eff, use(e), createFiberWith(scheduler, some(currentFiber)), sync),
  }
}

function createFiberWith(scheduler: Scheduler, parentFiber: Option<Fiber<unknown>>) {
  return <A>(effect: Effect<FiberEnv, A>) => createFiber(effect, scheduler, parentFiber)
}

function joinFiber<A>(fiber: Fiber<A>): Resume<Either<Error, A>> {
  return async((cb) =>
    fiber.onInfoChange(
      foldFiberInfo(disposeNone, disposeNone, flow(left, cb), flow(right, cb), flow(right, cb)),
    ),
  )
}

function killFiber<A>(fiber: Fiber<A>): Resume<void> {
  return sync(fiber.dispose())
}
