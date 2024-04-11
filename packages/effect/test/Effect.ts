import * as Effect from "@typed/effect"
import * as Either from "@typed/effect/Either"
import { describe, it } from "vitest"
import { asyncDispose } from "../src/internal/disposables"

describe("Effect", () => {
  it("Does something", async () => {
    const test = Effect.gen(function*() {
      const a = yield* Effect.of(1)
      const b = yield* Effect.sync(() => a + 1)
      const c = yield* Effect.async((resume: Effect.Async.Resume<never, number>) => {
        const id = setTimeout(() => resume.succeed(42), 10)
        return Effect.disposable(() => clearTimeout(id))
      })

      return a + b + c
    }).pipe(
      (_) => Effect.map(_, (x) => x + 1)
    )

    expect(await Effect.runFork(test)).toEqual(Either.right(46))
  })

  it("allow marking a region as uninterruptible", async () => {
    let ran = false
    const test = Effect.gen(function*() {
      const a = yield* Effect.of(1)
      const b = yield* Effect.sync(() => a + 1)
      const c = yield* Effect.uninterruptible(Effect.async((resume: Effect.Async.Resume<never, number>) => {
        const id = setTimeout(() => {
          console.log("running timeout")
          ran = true
          return resume.succeed(42)
        }, 100)
        return Effect.disposable(() => {
          console.log("clearing timeout")
          return clearTimeout(id)
        })
      }))

      return a + b + c
    }).pipe(
      (_) => Effect.map(_, (x) => x + 1)
    )
    console.time("Make process")
    const process = Effect.runFork(test)
    console.timeEnd("Make process")

    await asyncDispose(process)

    expect(ran).toBe(true)

    expect(await process).toEqual(Either.right(46))
  })
})
