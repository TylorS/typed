import * as Parts from "@typed/template/internal/parts"
import * as RenderContext from "@typed/template/RenderContext"
import { deepStrictEqual } from "assert"
import { Effect } from "effect"

describe("RenderQueue", () => {
  it("allows scheduling work to be commited sometime in the future", async () => {
    const test = Effect.gen(function*(_) {
      let i = 0

      const ctx = yield* _(RenderContext.RenderContext)
      const testPart = Parts.CommentPartImpl.server(0, () => Effect.unit)

      const add1A = () => i++
      const add1B = () => i++
      const add1C = () => i++
      const add1D = () => i++

      // When queuing multiple values before scheduling the queue, only the last value should be committed.
      yield* _(ctx.queue.add(testPart, add1A))
      yield* _(ctx.queue.add(testPart, add1B))

      yield* _(Effect.sleep(0)) // Wait for the queue to be scheduled next tick

      deepStrictEqual(i, 1)

      yield* _(ctx.queue.add(testPart, add1C))
      yield* _(ctx.queue.add(testPart, add1D))

      yield* _(Effect.sleep(0)) // Wait for the queue to be scheduled next tick

      deepStrictEqual(i, 2)
    }).pipe(
      Effect.provide(RenderContext.server()),
      Effect.scoped
    )

    await Effect.runPromise(test)
  })
})
