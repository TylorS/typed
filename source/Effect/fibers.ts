import { LazyDisposable, Disposable, lazy, disposeNone } from '@typed/fp/Disposable'
import { Effect, Resume, sync, async } from './Effect'
import { runPure } from './runEffect'
import { Either, right, left } from 'fp-ts/es6/Either'
import { fromEnv } from './fromEnv'
import { pipe } from 'fp-ts/lib/pipeable'
import { provide } from './provide'
import { Option, isSome, none, some } from 'fp-ts/es6/Option'
import { flow } from 'fp-ts/es6/function'
import { Scheduler } from '@most/types'
import { SchedulerEnv, createCallbackTask } from './SchedulerEnv'
import { asap } from '@most/scheduler'

export interface FiberEnv extends SchedulerEnv {
  readonly currentFiber: Fiber<unknown>
  readonly fork: <E, A>(effect: Effect<E, A>, env: E & FiberEnv) => Resume<Fiber<A>>
  readonly join: <A>(fiber: Fiber<A>) => Resume<Either<Error, A>>
  readonly kill: <A>(fiber: Fiber<A>) => Resume<void>
}

export const getCurrentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber))
export const getParentFiber = fromEnv((e: FiberEnv) => sync(e.currentFiber.parentFiber))

export const fork = <E, A>(effect: Effect<E, A>): Effect<E & FiberEnv, Fiber<A>> =>
  fromEnv((e) => e.fork(effect, e))

export const join = <A>(fiber: Fiber<A>): Effect<FiberEnv, Either<Error, A>> =>
  fromEnv((e) => e.join(fiber))

export const kill = <A>(fiber: Fiber<A>): Effect<FiberEnv, void> => fromEnv((e) => e.kill(fiber))

export interface Fiber<A> extends LazyDisposable {
  readonly info: FiberInfo<A>
  readonly parentFiber: Option<Fiber<unknown>>
  readonly onInfoChange: (f: (info: FiberInfo<A>) => Disposable) => Disposable
  readonly addFiber: (fiber: Fiber<unknown>) => void
}

export const enum FiberState {
  Running,
  Failed,
  Success,
}

export type FiberInfo<A> = FiberRunning | FiberFailed | FiberSuccess<A>

export type FiberRunning = {
  readonly state: FiberState.Running
}

export type FiberFailed = {
  readonly state: FiberState.Failed
  readonly error: Error
}

export type FiberSuccess<A> = {
  readonly state: FiberState.Success
  readonly value: A
}

/**
 * Intended for running an application using fibers. Should not be used to create fiber, instead
 * use `fork`
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
  let info: FiberInfo<A> = { state: FiberState.Running }
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
    addFiber,
  }

  if (isSome(parentFiber)) {
    parentFiber.value.addFiber(fiber)
  }

  // Use timer to ensure fiber has a chance to return before executing
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

  // Fork out a fiber
  function runFiber(): Disposable {
    const fiberEnv = createFiberEnv(fiber, scheduler)

    try {
      return pipe(
        effect,
        provide(fiberEnv),
        runPure((value) => {
          fiberValue = some(value)

          onFinish()

          return disposeNone()
        }),
      )
    } catch (error) {
      info = { state: FiberState.Failed, error }

      // Cleeanup all child process
      fiber.dispose()

      pushInfo()

      return disposeNone()
    }
  }

  // Subscribe to info changes, always starting with the current value
  function onInfoChange(cb: (info: FiberInfo<A>) => Disposable) {
    if (disposable.disposed) {
      return cb(info)
    }

    const infoDisposable = lazy()
    const subscriber = [cb, infoDisposable] as const

    infoDisposable.addDisposable(disposable.addDisposable(infoDisposable))
    infoDisposable.addDisposable(cb(info))

    subscribers.push(subscriber)

    infoDisposable.addDisposable({
      dispose: () => subscribers.splice(subscribers.indexOf(subscriber), 1),
    })

    return infoDisposable
  }

  function addFiber(childFiber: Fiber<unknown>): void {
    fibers.push(childFiber)

    // Cleanup from array after completion
    const fiberDisposable = indexOfDisposable(childFiber, fibers)
    const listener = disposable.addDisposable(
      childFiber.onInfoChange(foldFiberInfo(disposeNone, dispose, dispose)),
    )
    // Ensure if the parent fiber is disposed the child is too
    const parentDisposable = disposable.addDisposable(childFiber)
    // Ensure if the child fiber is disposed the child is cleaned up from parent
    const childDisposable = childFiber.addDisposable(parentDisposable)

    function dispose() {
      childDisposable.dispose()
      parentDisposable.dispose()
      fiberDisposable.dispose()
      listener.dispose()

      onFinish()

      return disposeNone()
    }
  }
}

function createFiberEnv(currentFiber: Fiber<unknown>, scheduler: Scheduler): FiberEnv {
  return {
    currentFiber,
    scheduler,
    fork: (eff, e) =>
      pipe(eff, provide(e), (a) => createFiber(a, scheduler, some(currentFiber)), sync),
    join: joinFiber,
    kill: killFiber,
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

export const foldFiberInfo = <A, B, C, D>(
  running: () => A,
  failed: (error: Error) => B,
  success: (value: C) => D,
) => (info: FiberInfo<C>): A | B | D => {
  switch (info.state) {
    case FiberState.Running:
      return running()
    case FiberState.Failed:
      return failed(info.error)
    case FiberState.Success:
      return success(info.value)
  }
}
