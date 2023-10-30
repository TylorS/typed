import * as Schema from "@effect/schema/Schema"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"

import { describe, it } from "vitest"

describe(__filename, () => {
  describe("runUpdate", () => {
    it("allows changing the value of a ref multiple times withing a single workflow", async () => {
      const test = Effect.gen(function*(_) {
        const ref = yield* _(RefSubject.of(1))
        const fiber = yield* _(ref, Fx.take(5), Fx.toReadonlyArray, Effect.fork)

        // Allow fiber to start
        yield* _(Effect.sleep(0))

        expect(
          yield* _(ref.runUpdate((get, set) =>
            Effect.gen(function*(_) {
              expect(yield* _(get)).toEqual(1)
              expect(yield* _(set(2))).toEqual(2)
              expect(yield* _(set(2))).toEqual(2) // Skips duplicates
              expect(yield* _(set(3))).toEqual(3)
              expect(yield* _(set(4))).toEqual(4)
              expect(yield* _(set(5))).toEqual(5)

              return 42
            })
          ))
        ).toEqual(42)

        const values = yield* _(Effect.fromFiber(fiber))

        expect(values).toEqual([1, 2, 3, 4, 5])
      })

      await Effect.runPromise(test)
    })
  })

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

  describe("withKey", () => {
    it("creates stable references to another Fx", async () => {
      type Foo = {
        id: string
        value: number
      }

      const a0: Foo = {
        id: "a",
        value: 0
      }
      const a1: Foo = {
        id: "a",
        value: 1
      }
      const b0: Foo = {
        id: "b",
        value: 2
      }
      const c0: Foo = {
        id: "c",
        value: 3
      }
      const c1: Foo = {
        id: "c",
        value: 4
      }

      const foos = [a0, a1, b0, c0, c1]

      const source = Fx.merge(foos.map((foo, i) => Fx.at(foo, i * 10)))

      let calls = 0

      const test = source.pipe(
        Fx.withKey((ref) => {
          calls++
          return Fx.map(ref, (x): Foo => ({ ...x, value: x.value + 1 }))
        }, {
          key: (f) => f.id
        }),
        Fx.toReadonlyArray
      )

      const actual = await Effect.runPromise(test)
      const expected = [
        { ...a0, value: a0.value + 1 },
        { ...a1, value: a1.value + 1 },
        { ...b0, value: b0.value + 1 },
        { ...c0, value: c0.value + 1 },
        { ...c1, value: c1.value + 1 }
      ]

      expect(actual).toEqual(expected)
      expect(calls).toEqual(3)
    })
  })
})
