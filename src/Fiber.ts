import { Either } from 'fp-ts/Either'
import { Branded } from './Branded'
import { Pure } from './Fx'

export interface Fiber<A> {
  readonly id: FiberId
  readonly status: Pure<FiberStatus<A>>
}

export type FiberId = Branded<{ readonly FiberId: unique symbol }, PropertyKey>

export type FiberStatus<A> =
  | FiberQueued
  | FiberRunning
  | FiberFailed
  | FiberPaused
  | FiberAborted
  | FiberFinished<A>
  | FiberCompleted<A>

/**
 * The initial state a fiber starts before running
 */
export type FiberQueued = {
  readonly type: 'queued'
}

/**
 * The state of a fiber when it begins running its computations
 */
export type FiberRunning = {
  readonly type: 'running'
}

/**
 * The state of a fiber when it has failed, but it still has uninterruptable child
 * fibers.
 */
export type FiberFailed = {
  readonly type: 'failed'
  readonly error: Error
}

/**
 * The state of a fiber when it has chosen to yield to its parent
 */
export type FiberPaused = {
  readonly type: 'paused'
}

/**
 * The state of a fiber when it has been aborted
 */
export type FiberAborted = {
  readonly type: 'aborted'
}

/**
 * The state of a fiber when it has computed a value, but still has child
 * fibers executing
 */
export type FiberFinished<A> = {
  readonly type: 'finished'
  readonly value: A
}

/**
 * The state of a fiber when it and all of its children have completed
 */
export type FiberCompleted<A> = {
  readonly type: 'completed'
  readonly value: Either<Error, A>
}
