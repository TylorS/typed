import { GetRandomValues, isUuid, makeNanoId, makeUuid } from "@typed/id"
import { Effect } from "effect"
import { describe, it } from "vitest"

const makeTestValues = (length: number) => {
  const values = new Uint8Array(length)
  for (let i = 0; i < length; ++i) {
    values[i] = i
  }
  return values
}

const provideTestValues = Effect.provide(GetRandomValues.implement((length) => Effect.succeed(makeTestValues(length))))

describe(__filename, () => {
  describe("Uuid", () => {
    it("genrates a UUID", async () => {
      const test = Effect.gen(function*(_) {
        const id = yield* _(makeUuid)
        expect(id).toEqual(`00010203-0405-0607-0809-0a0b0c0d0e0f`)
        expect(id.length).toEqual(36)
        expect(isUuid(id)).toEqual(true)
      }).pipe(provideTestValues)

      await Effect.runPromise(test)
    })
  })

  describe("NanoId", () => {
    it("genrates a NanoId", async () => {
      const test = Effect.gen(function*(_) {
        const id = yield* _(makeNanoId)

        expect(id).toEqual(`0123456789abcdefghijk`)
        expect(id.length).toEqual(21)
      }).pipe(provideTestValues)

      await Effect.runPromise(test)
    })
  })
})
