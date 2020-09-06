import { Disposable, disposeAll, disposeNone, lazy } from '@typed/fp/Disposable'
import { IO } from 'fp-ts/es6/IO'

import { Fiber, FiberState, foldFiberInfo } from '../Fiber'

export interface FiberManager extends Disposable {
  readonly addFiber: (fiber: Fiber<unknown>) => Disposable
  readonly pauseFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly runChildFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly hasRemainingFibers: () => boolean
  readonly proceed: () => void
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
    const parentResume = proceedFibers.get(fiber) || disposeNone
    const disposable = { dispose: () => pausedFibers.delete(fiber) }

    pausedFibers.set(fiber, resume)

    fiber.addDisposable(disposable)
    fiber.setPaused(true)

    proceedFibers.delete(fiber)

    return disposeAll([disposable, parentResume()])
  }

  function runChildFiber(fiber: Fiber<unknown>, returnToParent: IO<Disposable>): Disposable {
    const { state } = fiber.getInfo()

    const resume = pausedFibers.get(fiber) || returnToParent

    if (state === FiberState.Paused) {
      pausedFibers.delete(fiber)
      proceedFibers.set(fiber, returnToParent)

      fiber.setPaused(false)
    }

    return resume()
  }

  function proceed() {
    proceedFibers.clear()

    if (pausedFibers.size === 0) {
      return
    }

    const paused = Array.from(pausedFibers)

    pausedFibers.clear()

    paused.forEach(([fiber, resume]) => {
      fiber.setPaused(false)

      return resume()
    })
  }

  return {
    dispose: disposable.dispose,
    hasRemainingFibers,
    addFiber,
    pauseFiber,
    runChildFiber,
    proceed,
  }
}
