import * as Schema from "@effect/schema/Schema"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"

import { describe, it } from "vitest"

describe(__filename, () => {
  describe("deriveFromSchema", () => {
    const Foo = Schema.struct({
      id: Schema.string,
      name: Schema.string,
      address: Schema.struct({
        street: Schema.string,
        city: Schema.string
      })
    })

    type Foo = Schema.Schema.From<typeof Foo>

    const makeFooState = RefSubject.deriveFromSchema(Foo)

    const initial: Foo = {
      id: "asdf",
      name: "foo",
      address: {
        street: "Electric Avenue",
        city: "New York"
      }
    }

    it("allows deriving state management from a Schema", async () => {
      const test = Effect.gen(function*(_) {
        const { address: { city, street }, id, name } = yield* _(makeFooState(Effect.succeed<Foo>(initial)))

        expect(yield* _(id)).toEqual(initial.id)
        expect(yield* _(name)).toEqual(initial.name)
        expect(yield* _(city)).toEqual(initial.address.city)
        expect(yield* _(street)).toEqual(initial.address.street)
      })

      await Effect.runPromise(test)
    })

    it("allows deriving from another RefSubject", async () => {
      const test = Effect.gen(function*(_) {
        const source = yield* _(RefSubject.of<Foo>(initial))

        const { address: { city, street }, commit, id, name } = yield* _(makeFooState(source))

        expect(yield* _(id)).toEqual(initial.id)
        expect(yield* _(name)).toEqual(initial.name)
        expect(yield* _(city)).toEqual(initial.address.city)
        expect(yield* _(street)).toEqual(initial.address.street)

        yield* _(id.set("fdsa"))
        yield* _(name.set("bar"))

        expect(yield* _(id)).toEqual("fdsa")
        expect(yield* _(name)).toEqual("bar")

        expect(yield* _(source)).toEqual(initial)

        // Replicate local changes back into the Source RefSubject
        yield* _(commit)

        expect(yield* _(source)).toEqual({
          id: "fdsa",
          name: "bar",
          address: initial.address
        })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })
})
