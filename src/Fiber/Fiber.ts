import { Pure } from '@typed/fp/Fx'
import { ID } from '@typed/fp/ID'
import { Either } from 'fp-ts/dist/Either'

export type FiberID = ID<symbol>

export interface Fiber<E, A> {
  /**
   * Should be unique, unless you wish to dispose the currently running Fiber
   * and re-run it.
   */
  readonly id: FiberID

  /**
   * Get the current status of a Fiber
   */
  readonly status: Pure<FiberStatus<E, A>>
}

export type FiberStatus<E, A> =
  | FiberQueued
  | FiberRunning
  | FiberFailed<E>
  | FiberReturned<A>
  | FiberCompleted<E, A>

/**
 * Awaiting to start running
 */
export type FiberQueued = {
  readonly status: 'queued'
}

/**
 * A fiber that has started to run
 */
export type FiberRunning = {
  readonly status: 'running'
}

/**
 * A fiber that has failed, but has child fibers that are still running
 */
export type FiberFailed<E> = {
  readonly status: 'failed'
  readonly error: E
}

/**
 * A fiber that has returned a value, but has child fibers that are still running
 */
export type FiberReturned<A> = {
  readonly status: 'returned'
  readonly value: A
}

/**
 * A fiber that has no running child fibers and has either failed with an E or
 * succeeded with an A.
 */
export type FiberCompleted<E, A> = {
  readonly type: 'completed'
  readonly result: Either<E, A>
}

/**
 * A fiber that has been cancelled
 */
export type FiberInterrupted = {
  readonly type: 'interrupted'
}
