import * as Parts from "@typed/template/internal/parts"
import * as RenderQueue from "@typed/template/RenderQueue"

import { deepStrictEqual } from "assert"
import { Effect } from "effect"

describe("RenderQueue", () => {
  it("allows scheduling work to be commited sometime in the future", async () => {
    const test = Effect.gen(function*(_) {
      let i = 0

      const queue = yield* _(RenderQueue.RenderQueue)
      const testPart = Parts.CommentPartImpl.server(0, () => Effect.void)

      const add1 = () => i++

      // When queuing multiple values before scheduling the queue, only the last value should be committed.
      yield* _(queue.add(testPart, add1, RenderQueue.DEFAULT_PRIORITY))
      yield* _(queue.add(testPart, add1, RenderQueue.DEFAULT_PRIORITY))

      yield* _(Effect.sleep(50)) // Wait for the queue to be scheduled next tick

      deepStrictEqual(i, 1)

      yield* _(queue.add(testPart, add1, RenderQueue.DEFAULT_PRIORITY))
      yield* _(queue.add(testPart, add1, RenderQueue.DEFAULT_PRIORITY))

      yield* _(Effect.sleep(50)) // Wait for the queue to be scheduled next tick

      deepStrictEqual(i, 2)
    }).pipe(
      Effect.provide(RenderQueue.raf),
      Effect.scoped
    )

    await Effect.runPromise(test)
  })
})
