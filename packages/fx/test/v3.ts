import * as core from "@typed/fx/v3/internal/core"
import * as RefSubject from "@typed/fx/v3/RefSubject"
import { deepStrictEqual } from "assert"
import { Effect, Option } from "effect"

describe("V3", () => {
  describe("RefSubject", () => {
    it("allows managing state via Effect", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(Effect.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows managing state via Fx", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.make(core.succeed(0)))

        yield* _(ref)
        yield* _(RefSubject.update(ref, (x) => x + 1))
        yield* _(RefSubject.delete(ref))
        yield* _(ref)

        deepStrictEqual(yield* _(ref), 0)
        deepStrictEqual(yield* _(RefSubject.update(ref, (x) => x + 1)), 1)
        deepStrictEqual(yield* _(RefSubject.delete(ref)), Option.some(1))
        deepStrictEqual(yield* _(ref), 0)
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})
