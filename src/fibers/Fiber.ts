import { Disposable, disposeNone, LazyDisposable } from '@typed/fp/Disposable'
import { IO } from 'fp-ts/es6/IO'
import { Option } from 'fp-ts/es6/Option'

import { async, fromEnv, Pure } from '../Effect'

/**
 * A Fiber is a lightweight process which can be used similarly to promises within the context of Effects.
 * Guaranteed to be asynchronously executed.
 * @since 0.0.1
 */
export interface Fiber<A> extends LazyDisposable {
  // Always up-to-date information about a fiber
  readonly getInfo: IO<FiberInfo<A>>
  // Reference to the parent, if any
  readonly parentFiber: Option<Fiber<unknown>>
  // Listen to changes to the FiberInfo of the Fiber
  readonly onInfoChange: (f: (info: FiberInfo<A>) => Disposable) => Disposable // will always be called at least once with the current state
  // Track a child fiber
  readonly addChildFiber: (fiber: Fiber<unknown>) => Disposable

  /* Cooperative multitasking */
  readonly pauseChildFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable
  readonly runChildFiber: (fiber: Fiber<unknown>, resume: IO<Disposable>) => Disposable // resume any queued fibers
  readonly setPaused: (paused: boolean) => void // to update it's current information
}

/**
 * @since 0.0.1
 */
export const enum FiberState {
  Queued = 'queued',
  Paused = 'paused',
  Running = 'running',
  Failed = 'failed',
  Success = 'success',
  Completed = 'completed',
}

/**
 * @since 0.0.1
 */
export type FiberInfo<A> =
  | FiberQueued
  | FiberPaused
  | FiberRunning
  | FiberFailed
  | FiberSuccess<A>
  | FiberComplete<A>

/**
 * Starting state for a fiber
 * @since 0.0.1
 */
export type FiberQueued = {
  readonly state: FiberState.Queued
}

/**
 * Paused state for a fiber
 * @since 0.0.1
 */
export type FiberPaused = {
  readonly state: FiberState.Paused
}

/**
 * Fiber has begun executing
 * @since 0.0.1
 */
export type FiberRunning = {
  readonly state: FiberState.Running
}

/**
 * Executing a fiber process threw and exception
 * @since 0.0.1
 */
export type FiberFailed = {
  readonly state: FiberState.Failed
  readonly error: Error
}

/**
 * Parent fiber has a return value, but has forked fibers still running.
 * @since 0.0.1
 */
export type FiberSuccess<A> = {
  readonly state: FiberState.Success
  readonly value: A
}

/**
 * Parent fiber has a return value, and all forked fibers have completed.
 * @since 0.0.1
 */
export type FiberComplete<A> = {
  readonly state: FiberState.Completed
  readonly value: A
}

/**
 * @since 0.0.1
 */
export const foldFiberInfo = <A, B, C, D, E, F, G>(
  queued: () => A,
  paused: () => B,
  running: () => C,
  failed: (error: Error) => D,
  success: (value: E) => F,
  completed: (value: E) => G,
) => (info: FiberInfo<E>): A | B | C | D | F | G => {
  switch (info.state) {
    case FiberState.Queued:
      return queued()
    case FiberState.Paused:
      return paused()
    case FiberState.Running:
      return running()
    case FiberState.Failed:
      return failed(info.error)
    case FiberState.Success:
      return success(info.value)
    case FiberState.Completed:
      return completed(info.value)
  }
}

export const listenFor = <A extends FiberState>(state: A) => <B>(
  fiber: Fiber<B>,
): Pure<FiberEventFromState<A, B>> =>
  fromEnv(() =>
    async((resume) =>
      fiber.onInfoChange((info) =>
        info.state === state ? resume(info as FiberEventFromState<A, B>) : disposeNone(),
      ),
    ),
  )

export const awaitPaused = listenFor(FiberState.Paused)
export const awaitRunning = listenFor(FiberState.Running)
export const awaitFailed = listenFor(FiberState.Failed)
export const awaitSuccess = listenFor(FiberState.Success)
export const awaitCompleted = listenFor(FiberState.Completed)

export type FiberEventFromState<A extends FiberState, B> = A extends FiberState.Queued
  ? FiberQueued
  : A extends FiberState.Paused
  ? FiberPaused
  : A extends FiberState.Running
  ? FiberRunning
  : A extends FiberState.Failed
  ? FiberFailed
  : A extends FiberState.Success
  ? FiberSuccess<B>
  : A extends FiberState.Completed
  ? FiberComplete<B>
  : never
