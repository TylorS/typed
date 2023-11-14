import * as Effect from "effect/Effect"
import type { Scope } from "effect/Scope"
import * as TestClock from "effect/TestClock"
import * as TestContext from "effect/TestContext"
import type * as TestServices from "effect/TestServices"
import * as vitest from "vitest"

export { describe, expect } from "vitest"

export function it<E, A>(
  name: string,
  test: () => Effect.Effect<Scope, E, A>,
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

export function test<E, A>(
  name: string,
  test: (clock: TestClock.TestClock) => Effect.Effect<Scope | TestServices.TestServices, E, A>,
  options?: vitest.TestOptions
) {
  return vitest.it(
    name,
    () =>
      TestClock.testClockWith(test).pipe(
        Effect.provide(TestContext.TestContext),
        Effect.scoped,
        Effect.runPromise
      ),
    options
  )
}
