import { LazyDisposable, Disposable, lazy, disposeNone, disposeAll } from '@typed/fp/Disposable'
import { Effect, Resume, sync, async } from './Effect'
import { runPure } from './runEffect'
import { Either, right, left } from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { provide } from './provide'
import { Option, isSome, none, some } from 'fp-ts/es6/Option'
import { flow } from 'fp-ts/es6/function'
import { Scheduler } from '@most/types'
import { createCallbackTask } from './SchedulerEnv'
import { asap } from '@most/scheduler'
import { FiberEnv } from './FiberEnv'
import { Fiber, FiberInfo, FiberState, foldFiberInfo } from './Fiber'
import { doEffect } from './doEffect'

/**
 * Intended for running an application using fibers. Should not be used to create individual fibers, instead
 * use `fork`.
 */
export const runAsFiber = <A>(effect: Effect<FiberEnv, A>, scheduler: Scheduler): Fiber<A> =>
  createFiber(effect, scheduler)

/**
 * Convert a fiber to a Promise of it's completed value.
 */
export const fiberToPromise = <A>(fiber: Fiber<A>): Promise<A> =>
  new Promise((resolve, reject) => {
    fiber.onInfoChange(
      foldFiberInfo(disposeNone, flow(reject, disposeNone), flow(resolve, disposeNone)),
    )
  })

function createFiber<A>(
  effect: Effect<FiberEnv, A>,
  scheduler: Scheduler,
  parentFiber: Option<Fiber<unknown>> = none,
): Fiber<A> {
  let fiberValue: Option<A> = none
  let info: FiberInfo<A> = {
    state: FiberState.Running,
    get exitValue() {
      return fiberValue
    },
  }
  let subscribers: Array<readonly [(info: FiberInfo<A>) => Disposable, LazyDisposable]> = []
  let fibers: Array<Fiber<unknown>> = []

  const disposable = lazy()
  const fiber: Fiber<A> = {
    ...disposable,
    get disposed() {
      return disposable.disposed
    },
    get info() {
      return info
    },
    parentFiber,
    onInfoChange,
    addChildFiber,
  }

  if (isSome(parentFiber)) {
    parentFiber.value.addChildFiber(fiber)
  }

  // Use scheduler to ensure fiber has a chance to return before executing
  disposable.addDisposable(asap(createCallbackTask(runFiber), scheduler))

  // Cleanup on disposal
  disposable.addDisposable({
    dispose: () => {
      subscribers.forEach(([, d]) => d.dispose())
      subscribers = []
      fibers = []
    },
  })

  return fiber

  function pushInfo() {
    subscribers.slice().forEach(([f, d]) => !d.disposed && d.addDisposable(f(info)))
  }

  function onFinish() {
    if (fibers.length === 0 && isSome(fiberValue)) {
      info = { state: FiberState.Success, value: fiberValue.value }

      pushInfo()
    }
  }

  function onError(error: Error) {
    info = { state: FiberState.Failed, error }

    // Cleeanup all child process
    fiber.dispose()

    pushInfo()
  }

  // Fork out a fiber
  function runFiber(): Disposable {
    const fiberEnv = createFiberEnv(fiber, scheduler)

    try {
      return pipe(
        effect,
        catchEffectErrors(onError),
        provide(fiberEnv),
        runPure((value) => {
          // Only "complete" if not in an error state
          if (info.state === FiberState.Running) {
            fiberValue = some(value)

            // If not going to complete, because of child fibers, broadcast an event about
            // having a fiber value
            if (fibers.length > 0) {
              pushInfo()
            }

            onFinish()
          }

          return disposeNone()
        }),
      )
    } catch (error) {
      onError(error)

      return disposeNone()
    }
  }

  // Subscribe to info changes, always starting with the current value.
  // Always async to ensure Disposable can be returned before cb is executed
  function onInfoChange(cb: (info: FiberInfo<A>) => Disposable): Disposable {
    if (disposable.disposed) {
      return cb(info)
    }

    let initialCallbackHasRun = false
    const infoDisposable = lazy()

    const scheduledTask = asap(
      createCallbackTask(() => {
        initialCallbackHasRun = true

        return cb(info)
      }),
      scheduler,
    )

    const subscriber = [
      (info: FiberInfo<A>) => {
        // Delay any additional events until after initial info is able to return
        if (!initialCallbackHasRun) {
          return asap(
            createCallbackTask(() => cb(info)),
            scheduler,
          )
        }

        return cb(info)
      },
      infoDisposable,
    ] as const

    infoDisposable.addDisposable(disposable.addDisposable(infoDisposable))
    infoDisposable.addDisposable(scheduledTask)
    infoDisposable.addDisposable(indexOfDisposable(subscriber, subscribers))

    subscribers.push(subscriber)

    return infoDisposable
  }

  // Setup tracking of a child fiber
  function addChildFiber(childFiber: Fiber<unknown>): void {
    fibers.push(childFiber)

    // Cleanup from array after completion
    const fiberDisposable = indexOfDisposable(childFiber, fibers)
    // Listen to state changes from child fiber
    const listener = childFiber.onInfoChange(foldFiberInfo(disposeNone, dispose, dispose))
    // Ensure if the parent fiber is disposed the child is too
    const parentDisposable = disposable.addDisposable(childFiber)
    // Ensure if the child fiber is disposed the child is cleaned up from parent
    const childDisposable = childFiber.addDisposable(
      disposeAll([parentDisposable, fiberDisposable, listener]),
    )

    function dispose() {
      parentDisposable.dispose()
      fiberDisposable.dispose()
      listener.dispose()
      childDisposable.dispose()

      onFinish()

      return disposeNone()
    }
  }
}

function createFiberWith(scheduler: Scheduler, parentFiber: Option<Fiber<unknown>>) {
  return <A>(effect: Effect<FiberEnv, A>) => createFiber(effect, scheduler, parentFiber)
}

function createFiberEnv(currentFiber: Fiber<unknown>, scheduler: Scheduler): FiberEnv {
  return {
    currentFiber,
    scheduler,
    join: joinFiber,
    kill: killFiber,
    fork: (eff, e) => pipe(eff, provide(e), createFiberWith(scheduler, some(currentFiber)), sync),
  }
}

function indexOfDisposable<A>(a: A, as: Array<A>): Disposable {
  const dispose = () => {
    const index = as.indexOf(a)

    as.splice(index, 1)
  }

  return { dispose }
}

function joinFiber<A>(fiber: Fiber<A>): Resume<Either<Error, A>> {
  return async((cb) =>
    fiber.onInfoChange(foldFiberInfo(disposeNone, flow(left, cb), flow(right, cb))),
  )
}

function killFiber<A>(fiber: Fiber<A>): Resume<void> {
  return sync(fiber.dispose())
}

function catchEffectErrors(onError: (error: Error) => any) {
  return <E, A>(effect: Effect<E, A>): Effect<E, A> =>
    doEffect(function* () {
      try {
        return yield* effect
      } catch (error) {
        return onError(error)
      }
    })
}
