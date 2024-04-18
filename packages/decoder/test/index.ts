import * as Schema from "@effect/schema/Schema"
import * as Decoder from "@typed/decoder"
import * as Effect from "effect/Effect"

describe("Decoder", () => {
  const schema = Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    age: Schema.Number
  })

  const decoder = Decoder.fromSchema(schema)

  it("decodes a schema", async () => {
    const test = Effect.gen(function*(_) {
      const result = yield* _(decoder.decode({ id: "1", name: "Bob", age: 42 }))

      expect(result).toEqual({
        id: "1",
        name: "Bob",
        age: 42
      })
    })

    await Effect.runPromise(test)
  })

  describe("mapEffect", () => {
    it("allows transforming the result of a decoder with an Effect", async () => {
      const text = Decoder.mapEffect(decoder, (r) => Effect.succeed(`${r.name} is ${r.age}`))
      const test = Effect.gen(function*(_) {
        const result = yield* _(text.decode({ id: "1", name: "Bob", age: 42 }))

        expect(result).toEqual("Bob is 42")
      })

      await Effect.runPromise(test)
    })

    it("allows transforming the result of a Schema with an Effect", async () => {
      const text = Decoder.mapEffect(schema, (r) => Effect.succeed(`${r.name} is ${r.age}`))
      const test = Effect.gen(function*(_) {
        const result = yield* _(text.decode({ id: "1", name: "Bob", age: 42 }))

        expect(result).toEqual("Bob is 42")
      })

      await Effect.runPromise(test)
    })
  })

  describe("map", () => {
    it("allows transforming the result of a decoder", async () => {
      const text = Decoder.map(decoder, (r) => `${r.name} is ${r.age}`)
      const test = Effect.gen(function*(_) {
        const result = yield* _(text.decode({ id: "1", name: "Bob", age: 42 }))

        expect(result).toEqual("Bob is 42")
      })

      await Effect.runPromise(test)
    })

    it("allows transforming the result of a schema", async () => {
      const text = Decoder.map(schema, (r) => `${r.name} is ${r.age}`)
      const test = Effect.gen(function*(_) {
        const result = yield* _(text.decode({ id: "1", name: "Bob", age: 42 }))

        expect(result).toEqual("Bob is 42")
      })

      await Effect.runPromise(test)
    })
  })
})
