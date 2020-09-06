import { Disposable, disposeAll, disposeNone, lazy } from '@typed/fp/Disposable'
import { IO } from 'fp-ts/es6/IO'

import { Fiber, FiberState, foldFiberInfo } from '../Fiber'

export interface FiberManager extends Disposable {
  readonly fibers: ReadonlySet<Fiber<unknown>>
  readonly addFiber: (fiber: Fiber<unknown>) => Disposable
  readonly pauseFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly runChildFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
}

export function createFiberManager(onFinish: IO<void>): FiberManager {
  const disposable = lazy()
  const runningFibers = new Set<Fiber<unknown>>()
  const pausedFibers = new Map<Fiber<unknown>, IO<Disposable>>()
  const proceedFibers = new Map<Fiber<unknown>, IO<Disposable>>()

  function addFiber(fiber: Fiber<unknown>): Disposable {
    runningFibers.add(fiber)

    const fiberDisposable: Disposable = {
      dispose: () => runningFibers.delete(fiber),
    }
    const listener = fiber.onInfoChange(
      foldFiberInfo(disposeNone, disposeNone, disposeNone, onDispose, disposeNone, onDispose),
    )
    const parentDisposable = disposable.addDisposable(fiber)
    const fiberResourcesDisposable = disposeAll([fiberDisposable, listener, parentDisposable])
    const childDisposable = fiber.addDisposable(fiberResourcesDisposable)
    const allResourcesDisposable = disposeAll([childDisposable, fiberResourcesDisposable])

    return allResourcesDisposable

    function onDispose() {
      allResourcesDisposable.dispose()
      pausedFibers.delete(fiber)
      proceedFibers.delete(fiber)

      onFinish()

      return disposeNone()
    }
  }

  function pauseFiber(fiber: Fiber<unknown>, resume: IO<Disposable>): Disposable {
    if (!runningFibers.has(fiber)) {
      return disposeNone()
    }

    const parentResume = proceedFibers.get(fiber) || disposeNone
    const disposable = { dispose: () => pausedFibers.delete(fiber) }

    runningFibers.delete(fiber)
    pausedFibers.set(fiber, resume)

    fiber.addDisposable(disposable)
    fiber.setPaused(true)

    proceedFibers.delete(fiber)

    return disposeAll([disposable, parentResume()])
  }

  function runChildFiber(fiber: Fiber<unknown>, returnToParent: IO<Disposable>): Disposable {
    if (!pausedFibers.has(fiber)) {
      return returnToParent()
    }

    const { state } = fiber.getInfo()
    const resume = pausedFibers.get(fiber)!

    if (state === FiberState.Paused) {
      runningFibers.add(fiber)
      pausedFibers.delete(fiber)
      proceedFibers.set(fiber, returnToParent)

      fiber.setPaused(false)
    }

    return resume()
  }

  return {
    dispose: disposable.dispose,
    fibers: runningFibers,
    addFiber,
    pauseFiber,
    runChildFiber,
  }
}
