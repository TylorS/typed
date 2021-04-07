import { Either } from 'fp-ts/Either'

export type Status<A> =
  | Queued
  | Running
  | Failed
  | Paused
  | Aborting
  | Aborted
  | Finished<A>
  | Completed<A>

/**
 * The initial state a fiber starts before running
 */
export type Queued = {
  readonly type: 'queued'
}

/**
 * The state of a fiber when it begins running its computations
 */
export type Running = {
  readonly type: 'running'
}

/**
 * The state of a fiber when it has failed, but it still has uninterruptable child
 * fibers.
 */
export type Failed = {
  readonly type: 'failed'
  readonly error: Error
}

/**
 * The state of a fiber when it has chosen to yield to its parent
 */
export type Paused = {
  readonly type: 'paused'
}

/**
 * The state of a fiber when it has been aborted but has finalizers to run first.
 */
export type Aborting = {
  readonly type: 'aborting'
}

/**
 * The state of a fiber when it has been aborted
 */
export type Aborted = {
  readonly type: 'aborted'
}

/**
 * The state of a fiber when it has computed a value, but still has child
 * fibers executing
 */
export type Finished<A> = {
  readonly type: 'finished'
  readonly value: A
}

/**
 * The state of a fiber when it and all of its children have completed
 */
export type Completed<A> = {
  readonly type: 'completed'
  readonly value: Either<Error, A>
}
