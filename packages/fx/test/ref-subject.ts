import * as Schema from "@effect/schema/Schema"
import * as AsyncData from "@typed/async-data/AsyncData"
import { Progress } from "@typed/async-data/Progress"
import * as Fx from "@typed/fx/Fx"
import * as RefAsyncData from "@typed/fx/RefAsyncData"
import * as RefAsyncDataArray from "@typed/fx/RefAsyncDataArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

import { describe, it } from "vitest"

describe.concurrent(__filename, () => {
  describe.concurrent("runUpdate", () => {
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
              expect(yield* _(set(2))).toEqual(2) // concurrents duplicates
              expect(yield* _(set(3))).toEqual(3)
              expect(yield* _(set(4))).toEqual(4)
              expect(yield* _(set(5))).toEqual(5)

              return 42
            })
          ))
        ).toEqual(42)

        const values = yield* _(Effect.fromFiber(fiber))

        expect(values).toEqual([1, 2, 3, 4, 5])
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe.concurrent("deriveFromSchema", () => {
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
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })

    it("allows deriving from another RefSubject", async () => {
      const test = Effect.gen(function*(_) {
        const source = yield* _(RefSubject.of<Foo>(initial))

        const { address: { city, street }, id, name, persist } = yield* _(makeFooState(source))

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
        yield* _(persist)

        expect(yield* _(source)).toEqual({
          id: "fdsa",
          name: "bar",
          address: initial.address
        })
      }).pipe(Effect.scoped)

      await Effect.runPromise(test)
    })
  })

  describe.concurrent("withKey", () => {
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
        Fx.withKey((f) => f.id, (ref) => {
          calls++
          return Fx.map(ref, (x): Foo => ({ ...x, value: x.value + 1 }))
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

  describe.concurrent("matchTags", () => {
    it("allows using withKey to match over _tag values", async () => {
      type Foo = { _tag: "a"; value: number } | { _tag: "b"; value: number } | { _tag: "c"; value: number }

      const a0: Foo = {
        _tag: "a",
        value: 0
      }
      const a1: Foo = {
        _tag: "a",
        value: 1
      }
      const b0: Foo = {
        _tag: "b",
        value: 2
      }
      const c0: Foo = {
        _tag: "c",
        value: 3
      }
      const c1: Foo = {
        _tag: "c",
        value: 4
      }

      const foos = [a0, a1, b0, c0, c1]

      const source = Fx.merge(foos.map((foo, i) => Fx.at(foo, i * 10)))

      const matched = Fx.matchTags(source, {
        a: (ref) => ref.map((r) => r.value),
        b: (ref) => ref.map((r) => r.value),
        c: (ref) => ref.map((r) => r.value)
      })

      const test = Fx.toReadonlyArray(matched)

      const actual = await Effect.runPromise(test)

      expect(actual).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe.concurrent("RefAsyncData", () => {
    describe("matchKeyed", () => {
      it("allows creating persistent workflows around AsyncData", async () => {
        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefAsyncData.make<string, number>())

          expect(yield* _(ref)).toEqual(AsyncData.noData())

          const matched = RefAsyncData.matchKeyed(ref, {
            NoData: () => Fx.succeed(0),
            Loading: ({ progress }) => progress.filterMap(Option.map((p) => p.loaded)),
            Failure: (failure) => failure.map((s) => s.length),
            Success: (value) => value.map((x) => x + 1)
          })

          const fiber = yield* _(matched, Fx.toReadonlyArray, Effect.fork)

          // Let the fiber begin
          yield* _(Effect.sleep(0))

          yield* _(ref.set(AsyncData.loading({ progress: Progress(1n) })))
          yield* _(Effect.sleep(0)) // Allow fibers to run
          yield* _(ref.set(AsyncData.loading({ progress: Progress(100n) })))
          yield* _(Effect.sleep(0)) // Allow fibers to run
          yield* _(ref.set(AsyncData.fail("hello")))
          yield* _(Effect.sleep(0)) // Allow fibers to run
          yield* _(ref.set(AsyncData.success(41)))

          yield* _(ref.interrupt)

          const values = yield* _(Effect.fromFiber(fiber))

          expect(values).toEqual([0, 1n, 100n, 5, 42])
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })
  })

  describe.concurrent("RefAsyncDataArray", () => {
    describe.concurrent("matchKeyed", () => {
      it("allows creating persistent workflows for each value in the success array", async () => {
        type Foo = {
          readonly id: string
          readonly value: number
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

        let calls = 0

        const test = Effect.gen(function*(_) {
          const ref = yield* _(RefAsyncDataArray.make<never, Foo>())
          const matched = RefAsyncDataArray.matchKeyed(ref, (f) => f.id, {
            NoData: () => Effect.succeed([]),
            Loading: () => Effect.succeed([]),
            Failure: (_, { cause }) => Effect.flatMap(cause, Effect.failCause),
            Success: (foo) => {
              calls++
              return foo.map((f) => f.value)
            }
          })

          const fiber = yield* _(matched, Fx.toReadonlyArray, Effect.fork)

          // Let the fiber begin
          yield* _(Effect.sleep(0))

          yield* _(RefAsyncData.succeed(ref, [a0, b0, c0]))
          yield* _(Effect.sleep(0)) // Allow fibers to run
          yield* _(RefAsyncData.succeed(ref, [c1, a1, b0]))
          yield* _(Effect.sleep(0))
          yield* _(RefAsyncData.succeed(ref, [c1, a1, b0])) // skips repeats
          yield* _(Effect.sleep(0))
          yield* _(RefAsyncData.succeed(ref, [b0, c1, a1])) // rotate
          yield* _(Effect.sleep(0))

          yield* _(ref.interrupt)

          const values = yield* _(Effect.fromFiber(fiber))

          expect(values).toEqual([
            [],
            [0, 2, 3],
            /* glitch, due to the diamond problem */
            [4, 0, 2],
            [4, 1, 2],
            [
              2,
              4,
              1
            ]
          ])

          expect(calls).toEqual(3)
        }).pipe(Effect.scoped)

        await Effect.runPromise(test)
      })
    })
  })
})
