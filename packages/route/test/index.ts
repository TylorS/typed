import { ArrayFormatter, Schema } from "@effect/schema"
import * as Guard from "@typed/guard"
import * as Route from "@typed/route"
import { ok } from "assert"
import { Effect, Either, Option } from "effect"

describe(__filename, () => {
  describe(Route.fromPath, () => {
    const route = Route.fromPath("/foo/:id")

    describe("match", () => {
      it("matches", () => {
        const actual = route.match("/foo/123")
        const expected = Option.some({ id: "123" })

        expect(actual).toEqual(expected)
      })

      it("does not match", () => {
        const actual = route.match("/bar/123")

        expect(actual).toEqual(Option.none())
      })
    })

    describe("make", () => {
      it("makes a path", () => {
        const actual = route.make({ id: "123" })
        const expected = "/foo/123"

        expect(actual).toEqual(expected)
      })
    })

    describe("concat", () => {
      it("concats two routes", () => {
        const route2 = Route.fromPath("/bar/:id2")
        const actual = route.concat(route2)
        const expected = Route.fromPath("/foo/:id/bar/:id2")

        expect(actual.path).toEqual(expected.path)
        expect(actual.match("/foo/123/bar/456")).toEqual(Option.some({ id: "123", id2: "456" }))
        expect(actual.make({ id: "123", id2: "456" })).toEqual("/foo/123/bar/456")
      })
    })
  })

  it("can be decoded as a Guard", async () => {
    const guard = Route.fromPath("/foo/:fooId").pipe(
      Guard.decode(Schema.struct({ fooId: Schema.NumberFromString })),
      Guard.addTag("Test")
    )
    const test = Effect.gen(function*(_) {
      const a = yield* _(guard("/foo/123"))
      expect(a).toEqual(Option.some({ _tag: "Test", fooId: 123 }))

      const b = yield* _(guard("/foo/bar"), Effect.either)
      ok(Either.isLeft(b))
      const issues = ArrayFormatter.formatError(b.left)

      expect(issues).toEqual([
        {
          _tag: "Type",
          path: ["fooId"],
          message: `Expected NumberFromString, actual "bar"`
        }
      ])

      const c = yield* _(guard("/bar/123"))
      expect(c).toEqual(Option.none())
    })

    await Effect.runPromise(test)
  })

  it("can be decoded with multiple routes", async () => {
    const foo = Route.fromPath("/foo/:fooId").pipe(
      Guard.decode(Schema.struct({ fooId: Schema.NumberFromString }))
    )
    const bar = Route.fromPath("/bar/:barId").pipe(
      Guard.decode(Schema.struct({ barId: Schema.NumberFromString }))
    )
    const foobar = Guard.any({ foo, bar })

    const test = Effect.gen(function*(_) {
      const a = yield* _(foobar("/foo/123"))
      expect(a).toEqual(Option.some({ _tag: "foo", value: { fooId: 123 } }))

      const b = yield* _(foobar("/bar/123"))
      expect(b).toEqual(Option.some({ _tag: "bar", value: { barId: 123 } }))

      const c = yield* _(foobar("/foo/bar"), Effect.either)
      ok(Either.isLeft(c))
      expect(ArrayFormatter.formatError(c.left)).toEqual([
        {
          _tag: "Type",
          path: ["fooId"],
          message: `Expected NumberFromString, actual "bar"`
        }
      ])

      const d = yield* _(foobar("/baz/123"))
      expect(d).toEqual(Option.none())
    })

    await Effect.runPromise(test)
  })
})
