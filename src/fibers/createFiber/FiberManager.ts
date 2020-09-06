import { Disposable, disposeAll, disposeNone, lazy } from '@typed/fp/Disposable'
import { IO } from 'fp-ts/es6/IO'

import { Fiber, FiberState, foldFiberInfo } from '../Fiber'

export interface FiberManager extends Disposable {
  readonly addFiber: (fiber: Fiber<unknown>) => Disposable
  readonly pauseFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly runChildFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly hasRemainingFibers: () => boolean
}

export function createFiberManager(onFinish: IO<void>): FiberManager {
  const disposable = lazy()
  const fibers = new Set<Fiber<unknown>>()
  const pausedFibers = new Map<Fiber<unknown>, IO<Disposable>>()
  const proceedFibers = new Map<Fiber<unknown>, IO<Disposable>>()

  function addFiber(fiber: Fiber<unknown>): Disposable {
    fibers.add(fiber)

    const fiberDisposable: Disposable = {
      dispose: () => fibers.delete(fiber),
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

      onFinish()

      return disposeNone()
    }
  }

  const hasRemainingFibers = () => fibers.size > 0

  function pauseFiber(fiber: Fiber<unknown>, resume: IO<Disposable>): Disposable {
    pausedFibers.set(fiber, resume)

    const disposable = { dispose: () => pausedFibers.delete(fiber) }

    fiber.addDisposable(disposable)
    fiber.setPaused(true)

    const parentResume = proceedFibers.get(fiber) || disposeNone

    proceedFibers.delete(fiber)

    parentResume()

    return disposable
  }

  function runChildFiber(fiber: Fiber<unknown>, resume: IO<Disposable>): Disposable {
    const { state } = fiber.getInfo()

    const childResume = pausedFibers.get(fiber)

    pausedFibers.delete(fiber)

    if (!childResume || state !== FiberState.Paused) {
      return resume()
    }

    proceedFibers.set(fiber, resume)

    fiber.setPaused(false)

    return childResume()
  }

  return {
    dispose: disposable.dispose,
    hasRemainingFibers,
    addFiber,
    pauseFiber,
    runChildFiber,
  }
}
