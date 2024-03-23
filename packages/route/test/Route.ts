import { Schema } from "@effect/schema"
import * as Route from "@typed/route/Route"
import { deepStrictEqual } from "assert"
import { Effect, Option } from "effect"

describe("Route", () => {
  const foo = Route.lit("foo").concat(Route.end.concat(Route.int("fooId").prefix("foo-")))
  const bar = Route.lit("bar").concat(Route.end.concat(Route.int("barId").prefix("bar-")))
  const foobar = foo.concat(bar)

  const unnamed = Route.lit("test").concat(Route.unnamed).concat(Route.lit("test2")).concat(Route.unnamed)
  const param = Route.param("test")
  const zeroOrMore = param.zeroOrMore()
  const oneOrMore = param.oneOrMore()
  const optional = param.optional()

  it("generates paths", () => {
    deepStrictEqual(foobar.path, "/foo/{foo-:fooId}/bar/{bar-:barId}")
    deepStrictEqual(unnamed.path, "/test/(.*)/test2/(.*)")
    deepStrictEqual(param.path, "/:test")
    deepStrictEqual(zeroOrMore.path, "/:test*")
    deepStrictEqual(oneOrMore.path, "/:test+")
    deepStrictEqual(optional.path, "/:test?")
  })

  it("generates schemas", async () => {
    const decodeFoobar = Schema.decode(foobar.schema)
    const decodeUnnamed = Schema.decode(unnamed.schema)
    const decodeParam = Schema.decode(param.schema)
    const decodeZeroOrMore = Schema.decode(zeroOrMore.schema)
    const decodeOneOrMore = Schema.decode(oneOrMore.schema)
    const decodeOptional = Schema.decode(optional.schema)
    const test = Effect.gen(function*(_) {
      deepStrictEqual(yield* _(decodeFoobar({ fooId: "1", barId: "2" })), { fooId: 1, barId: 2 })
      deepStrictEqual(yield* _(decodeUnnamed({ 0: "123", 1: "456" })), { 0: "123", 1: "456" })
      deepStrictEqual(yield* _(decodeParam({ test: "test" })), { test: "test" })
      deepStrictEqual(yield* _(decodeZeroOrMore({ test: ["test", "test"] })), { test: ["test", "test"] })
      deepStrictEqual(yield* _(decodeOneOrMore({ test: ["test"] })), { test: ["test"] })
      deepStrictEqual(yield* _(decodeOptional({ test: "test" })), { test: "test" })
      deepStrictEqual(yield* _(decodeOptional({})), {})
    })

    await Effect.runPromise(test)
  })

  it("can be guarded", async () => {
    const fooBarGuarded = Route.guard(
      foobar,
      (params) => params.fooId === 1 ? Effect.succeedSome(params) : Effect.succeedNone
    )

    const unnamedGuarded = Route.guard(
      unnamed,
      (params) => params[0] === "foo" ? Effect.succeedSome(params) : Effect.succeedNone
    )

    const zeroOrMoreGuarded = Route.guard(
      zeroOrMore,
      (params) => params.test?.length === 2 ? Effect.succeedSome(params) : Effect.succeedNone
    )

    const test = Effect.gen(function*(_) {
      deepStrictEqual(yield* _(fooBarGuarded("/foo/foo-1/bar/bar-2")), Option.some({ fooId: 1, barId: 2 }))
      deepStrictEqual(yield* _(fooBarGuarded("/foo/foo-2/bar/bar-2")), Option.none())
      deepStrictEqual(yield* _(unnamedGuarded("/test/foo/test2/bar")), Option.some({ 0: "foo", 1: "bar" }))
      deepStrictEqual(yield* _(unnamedGuarded("/test/bar/test2/foo")), Option.none())

      deepStrictEqual(yield* _(zeroOrMoreGuarded("/test/test")), Option.some({ test: ["test", "test"] }))
      deepStrictEqual(yield* _(zeroOrMoreGuarded("/test")), Option.none())
      deepStrictEqual(yield* _(zeroOrMoreGuarded("/")), Option.none())
    })

    await Effect.runPromise(test)
  })
})
