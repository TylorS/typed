import { Schema } from "@effect/schema"
import * as Route from "@typed/route/Route"
import { deepEqual } from "assert"
import { Effect, Option } from "effect"

describe("Route", () => {
  const foo = Route.lit("foo").concat(Route.end.concat(Route.integer("fooId").prefix("foo-")))
  const bar = Route.lit("bar").concat(Route.end.concat(Route.integer("barId").prefix("bar-")))
  const foobar = foo.concat(bar)

  const unnamed = Route.lit(`test`).concat(Route.unnamed).concat(Route.lit("test2")).concat(Route.unnamed)
  const param = Route.param("test")
  const zeroOrMore = param.zeroOrMore()
  const oneOrMore = param.oneOrMore()
  const optional = param.optional()

  it("generates paths", () => {
    deepEqual(foobar.path, "/foo/{foo-:fooId}/bar/{bar-:barId}")
    deepEqual(unnamed.path, "/test/(.*)/test2/(.*)")
    deepEqual(param.path, "/:test")
    deepEqual(zeroOrMore.path, "/:test*")
    deepEqual(oneOrMore.path, "/:test+")
    deepEqual(optional.path, "/:test?")
  })

  it("generates schemas", async () => {
    const decodeFoobar = Schema.decode(foobar.schema)
    const decodeUnnamed = Schema.decode(unnamed.schema)
    const decodeParam = Schema.decode(param.schema)
    const decodeZeroOrMore = Schema.decode(zeroOrMore.schema)
    const decodeOneOrMore = Schema.decode(oneOrMore.schema)
    const decodeOptional = Schema.decode(optional.schema)
    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(decodeFoobar({ fooId: "1", barId: "2" })), { fooId: 1, barId: 2 })
      deepEqual(yield* _(decodeUnnamed({ 0: "123", 1: "456" })), { 0: "123", 1: "456" })
      deepEqual(yield* _(decodeParam({ test: "test" })), { test: "test" })
      deepEqual(yield* _(decodeZeroOrMore({ test: ["test", "test"] })), { test: ["test", "test"] })
      deepEqual(yield* _(decodeOneOrMore({ test: ["test"] })), { test: ["test"] })
      deepEqual(yield* _(decodeOptional({ test: "test" })), { test: "test" })
      deepEqual(yield* _(decodeOptional({})), {})
    })

    await Effect.runPromise(test)
  })

  it("interpolates paths", () => {
    deepEqual(foobar.interpolate({ fooId: "1", barId: "2" }), "/foo/foo-1/bar/bar-2")
    deepEqual(unnamed.interpolate({ 0: "123", 1: "456" }), "/test/123/test2/456")
    deepEqual(param.interpolate({ test: "test" }), "/test")
    deepEqual(zeroOrMore.interpolate({ test: ["test", "test"] }), "/test/test")
    deepEqual(oneOrMore.interpolate({ test: ["test"] }), "/test")
    deepEqual(optional.interpolate({ test: "test" }), "/test")
  })

  it("matches paths", () => {
    deepEqual(foobar.match("/foo/foo-1/bar/bar-2"), Option.some({ fooId: "1", barId: "2" }))
    deepEqual(unnamed.match("/test/123/test2/456"), Option.some({ 0: "123", 1: "456" }))
    deepEqual(param.match("/test"), Option.some({ test: "test" }))
    deepEqual(zeroOrMore.match("/test/test"), Option.some({ test: ["test", "test"] }))
    deepEqual(oneOrMore.match("/test"), Option.some({ test: ["test"] }))
    deepEqual(optional.match("/test"), Option.some({ test: "test" }))
    deepEqual(optional.match("/"), Option.some({}))
  })

  it("can be decoded", async () => {
    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(Route.decode(foobar, "/foo/foo-1/bar/bar-2")), { fooId: 1, barId: 2 })
      deepEqual(yield* _(Route.decode(unnamed, "/test/123/test2/456")), { 0: "123", 1: "456" })
      deepEqual(yield* _(Route.decode(param, "/test")), { test: "test" })
      deepEqual(yield* _(Route.decode(zeroOrMore, "/test/test/")), { test: ["test", "test"] })
      deepEqual(yield* _(Route.decode(oneOrMore, "/test")), { test: ["test"] })
      deepEqual(yield* _(Route.decode(optional, "/test")), { test: "test" })
      deepEqual(yield* _(Route.decode(optional, "/")), {})
    })

    await Effect.runPromise(test)
  })

  it("can be encoded", () => {
    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(Route.encode(foobar, { fooId: 1, barId: 2 })), "/foo/foo-1/bar/bar-2")
      deepEqual(yield* _(Route.encode(unnamed, { 0: "123", 1: "456" })), "/test/123/test2/456")
      deepEqual(yield* _(Route.encode(param, { test: "test" })), "/test")
      deepEqual(yield* _(Route.encode(zeroOrMore, { test: ["test", "test"] })), "/test/test")
      deepEqual(yield* _(Route.encode(oneOrMore, { test: ["test"] })), "/test")
      deepEqual(yield* _(Route.encode(optional, { test: "test" })), "/test")
      deepEqual(yield* _(Route.encode(optional, {})), "/")
    })

    return Effect.runPromise(test)
  })

  it("transforms", async () => {
    const foobarTransformed = foobar.pipe(
      Route.transform(
        Schema.struct({ foo: Schema.number.pipe(Schema.int()), bar: Schema.number.pipe(Schema.int()) }),
        ({ barId, fooId }) => ({ foo: fooId, bar: barId } as const),
        ({ bar, foo }) => ({ fooId: foo, barId: bar })
      )
    )

    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(foobarTransformed, Route.decode("/foo/foo-1/bar/bar-2")), { foo: 1, bar: 2 })
      deepEqual(yield* _(foobarTransformed, Route.encode({ foo: 1, bar: 2 })), "/foo/foo-1/bar/bar-2")
    })

    await Effect.runPromise(test)
  })
})
