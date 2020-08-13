import { LazyDisposable, Disposable } from '@typed/fp/Disposable'
import { Option } from 'fp-ts/es6/Option'

/**
 * A Fiber is a lightweight process which can be used similarly to promises within a
 */
export interface Fiber<A> extends LazyDisposable {
  // Always up-to-date information about a fiber
  readonly info: FiberInfo<A>
  // Reference to the parent, if any
  readonly parentFiber: Option<Fiber<unknown>>
  // Listen to changes to the FiberInfo of the Fiber
  readonly onInfoChange: (f: (info: FiberInfo<A>) => Disposable) => Disposable // will always be called at least once with the current state
  // Track a child fiber
  readonly addChildFiber: (fiber: Fiber<unknown>) => void
}

export const enum FiberState {
  Running,
  Failed,
  Success,
}

export type FiberInfo<A> = FiberRunning<A> | FiberFailed | FiberSuccess<A>

export type FiberRunning<A> = {
  readonly state: FiberState.Running
  readonly exitValue: Option<A> // Will be Some<A> if the parent process returns a value but still has child fibers running
}

// Executing a fiber process threw and exception
export type FiberFailed = {
  readonly state: FiberState.Failed
  readonly error: Error
}

export type FiberSuccess<A> = {
  readonly state: FiberState.Success
  readonly value: A
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
