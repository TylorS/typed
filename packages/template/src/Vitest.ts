/**
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import * as TestClock from "effect/TestClock"
import * as TestContext from "effect/TestContext"
import type * as TestServices from "effect/TestServices"
import * as vitest from "vitest"
import * as RenderQueue from "./RenderQueue.js"

const describeConcurrent = vitest.describe.concurrent
const expect = vitest.expect

export {
  /**
   * @since 1.0.0
   */
  describeConcurrent as describe,
  /**
   * @since 1.0.0
   */
  expect
}

/**
 * @since 1.0.0
 */
export function it<E, A>(
  name: string,
  test: () => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue>,
  options?: vitest.TestOptions
) {
  return vitest.it.concurrent(
    name,
    () =>
      test().pipe(
        Effect.provide(RenderQueue.sync),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}

it.only = function it<E, A>(
  name: string,
  test: () => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue>,
  options?: vitest.TestOptions
) {
  return vitest.it.only(
    name,
    () =>
      test().pipe(
        Effect.provide(RenderQueue.sync),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}

it.skip = function it<E, A>(
  name: string,
  test: () => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue>,
  options?: vitest.TestOptions
) {
  return vitest.it.skip(
    name,
    () =>
      test().pipe(
        Effect.provide(RenderQueue.sync),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}

/**
 * @since 1.0.0
 */
export function test<E, A>(
  name: string,
  test: (options: {
    readonly clock: TestClock.TestClock
  }) => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue | TestServices.TestServices>,
  options?: vitest.TestOptions
) {
  return vitest.it.concurrent(
    name,
    () =>
      TestClock.testClockWith((clock) => test({ clock })).pipe(
        Effect.provide(RenderQueue.sync),
        Effect.provide(TestContext.TestContext),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}

test.only = function test<E, A>(
  name: string,
  test: (options: {
    readonly clock: TestClock.TestClock
  }) => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue | TestServices.TestServices>,
  options?: vitest.TestOptions
) {
  return vitest.it.only(
    name,
    () =>
      TestClock.testClockWith((clock) => test({ clock })).pipe(
        Effect.provide(RenderQueue.sync),
        Effect.provide(TestContext.TestContext),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}

test.skip = function test<E, A>(
  name: string,
  test: (options: {
    readonly clock: TestClock.TestClock
  }) => Effect.Effect<A, E, Scope | RenderQueue.RenderQueue | TestServices.TestServices>,
  options?: vitest.TestOptions
) {
  return vitest.it.skip(
    name,
    () =>
      TestClock.testClockWith((clock) => test({ clock })).pipe(
        Effect.provide(RenderQueue.sync),
        Effect.provide(TestContext.TestContext),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}
