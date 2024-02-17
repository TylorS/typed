/**
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import * as TestClock from "effect/TestClock"
import * as TestContext from "effect/TestContext"
import type * as TestServices from "effect/TestServices"
import * as vitest from "vitest"

export {
  /**
   * @since 1.0.0
   */
  describe,
  /**
   * @since 1.0.0
   */
  expect
} from "vitest"

/**
 * @since 1.0.0
 */
export function it<E, A>(
  name: string,
  test: () => Effect.Effect<A, E, Scope>,
  options?: vitest.TestOptions
) {
  return vitest.it(
    name,
    () =>
      test().pipe(
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
  }) => Effect.Effect<A, E, Scope | TestServices.TestServices>,
  options?: vitest.TestOptions
) {
  return vitest.it(
    name,
    () =>
      TestClock.testClockWith((clock) => test({ clock })).pipe(
        Effect.provide(TestContext.TestContext),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}
