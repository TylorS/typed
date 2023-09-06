import * as Effect from "@effect/io/Effect"
import * as Fx from "@typed/fx/Fx"
import * as Sink from "@typed/fx/Sink"
import { describe, it } from "vitest"

describe(__filename, () => {
  it("does things", async () => {
    const fx = Fx.fromPush(Sink.events([1, 2, 3]))
    const test = Fx.toReadonlyArray(fx)
    let total = 0
    const iterations = 100

    for (let i = 0; i < iterations; ++i) {
      const start = Date.now()
      const values = await Effect.runPromise(test)
      const end = Date.now()

      total += end - start

      expect(values).toEqual([1, 2, 3])
    }

    console.log(`Total time: ${total}ms`)
    console.log(`Average time: ${total / iterations}ms`)
  })
})
