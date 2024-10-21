import { Schema } from "@effect/schema"
import * as Route from "@typed/route/Route"
import { deepEqual } from "assert"
import { Effect, Option } from "effect"

describe("Route", () => {
  const foo = Route.literal("foo").concat(Route.end, Route.integer("fooId").prefix("foo-"))
  const bar = Route.literal("bar").concat(Route.end, Route.integer("barId").prefix("bar-"))
  const foobar = foo.concat(bar)

  const unnamed = Route.literal(`test`).concat(Route.unnamed, Route.literal("test2"), Route.unnamed)
  const param = Route.param("test")
  const zeroOrMore = param.zeroOrMore()
  const oneOrMore = param.oneOrMore()
  const optional = param.optional()

  const concatLiterals = Route.literal("foo").concat(Route.literal("bar"))
  const concatWithPrefix = Route.parse("/").concat(Route.literal("foo")).concat(Route.literal("bar"))

  it("generates paths", () => {
    deepEqual(foobar.path, "/foo/{foo-:fooId}/bar/{bar-:barId}")
    deepEqual(unnamed.path, "/test/(.*)/test2/(.*)")
    deepEqual(param.path, "/:test")
    deepEqual(zeroOrMore.path, "/:test*")
    deepEqual(oneOrMore.path, "/:test+")
    deepEqual(optional.path, "/:test?")
    deepEqual(concatLiterals.path, "/foo/bar")
    deepEqual(concatWithPrefix.path, "/foo/bar")
  })

  it("generates schemas", async () => {
    const decodeFoobar = Schema.decode(foobar.schema)
    const decodeUnnamed = Schema.decode(unnamed.schema)
    const decodeParam = Schema.decode(param.schema)
    const decodeZeroOrMore = Schema.decode(zeroOrMore.schema)
    const decodeOneOrMore = Schema.decode(oneOrMore.schema)
    const decodeOptional = Schema.decode(optional.schema)
    const decodeHome = Schema.decode(Route.home.schema)
    const decodeEnd = Schema.decode(Route.end.schema)
    const decodeConcatLiterals = Schema.decode(concatLiterals.schema)
    const decodeConcatWithPrefix = Schema.decode(concatWithPrefix.schema)
    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(decodeFoobar({ fooId: "1", barId: "2" })), { fooId: 1, barId: 2 })
      deepEqual(yield* _(decodeUnnamed({ 0: "123", 1: "456" })), { 0: "123", 1: "456" })
      deepEqual(yield* _(decodeParam({ test: "test" })), { test: "test" })
      deepEqual(yield* _(decodeZeroOrMore({ test: ["test", "test"] })), { test: ["test", "test"] })
      deepEqual(yield* _(decodeOneOrMore({ test: ["test"] })), { test: ["test"] })
      deepEqual(yield* _(decodeOptional({ test: "test" })), { test: "test" })
      deepEqual(yield* _(decodeOptional({})), {})
      deepEqual(yield* _(decodeHome({})), {})
      deepEqual(yield* _(decodeEnd({})), {})
      deepEqual(yield* _(decodeConcatLiterals({})), {})
      deepEqual(yield* _(decodeConcatWithPrefix({})), {})
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
    deepEqual(Route.home.interpolate({}), "/")
    deepEqual(Route.end.interpolate({}), "/")
    deepEqual(Route.literal("/foo").concat(Route.param("fooId")).interpolate({ fooId: "123" }), "/foo/123")
    deepEqual(concatLiterals.interpolate({}), "/foo/bar")
    deepEqual(concatWithPrefix.interpolate({}), "/foo/bar")
  })

  it("matches paths", () => {
    deepEqual(foobar.match("/foo/foo-1/bar/bar-2"), Option.some({ fooId: "1", barId: "2" }))
    deepEqual(unnamed.match("/test/123/test2/456"), Option.some({ 0: "123", 1: "456" }))
    deepEqual(param.match("/test"), Option.some({ test: "test" }))
    deepEqual(zeroOrMore.match("/test/test"), Option.some({ test: ["test", "test"] }))
    deepEqual(oneOrMore.match("/test"), Option.some({ test: ["test"] }))
    deepEqual(optional.match("/test"), Option.some({ test: "test" }))
    deepEqual(optional.match("/"), Option.some({}))

    // Home matches only the root path
    deepEqual(Route.home.match("/"), Option.some({}))
    deepEqual(Route.home.match("/foo"), Option.none())

    // End matches any path that starts with a `/`
    deepEqual(Route.end.match("/"), Option.some({}))
    deepEqual(Route.end.match("/foo"), Option.some({}))
    deepEqual(Route.end.match("/foo/bar"), Option.some({}))

    // Literal matches only the literal path
    deepEqual(concatLiterals.match("/foo/bar"), Option.some({}))
    deepEqual(concatLiterals.match("/foo"), Option.none())

    deepEqual(concatWithPrefix.match("/foo/bar"), Option.some({}))
    deepEqual(concatWithPrefix.match("/foo"), Option.none())
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
      deepEqual(yield* _(Route.decode(Route.home, "/")), {})
      deepEqual(yield* _(Route.decode(Route.end, "/")), {})
      deepEqual(yield* _(Route.decode(concatLiterals, "/foo/bar")), {})
      deepEqual(yield* _(Route.decode(concatWithPrefix, "/foo/bar")), {})
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
      deepEqual(yield* _(Route.encode(Route.home, {})), "/")
      deepEqual(yield* _(Route.encode(Route.end, {})), "/")
      deepEqual(yield* _(Route.encode(concatLiterals, {})), "/foo/bar")
      deepEqual(yield* _(Route.encode(concatWithPrefix, {})), "/foo/bar")
    })

    return Effect.runPromise(test)
  })

  it("transforms", async () => {
    const foobarTransformed = foobar.pipe(
      Route.transform(
        Schema.Struct({ foo: Schema.Number.pipe(Schema.int()), bar: Schema.Number.pipe(Schema.int()) }),
        ({ barId, fooId }) => ({ foo: fooId, bar: barId }),
        ({ bar, foo }) => ({ fooId: foo, barId: bar })
      )
    )

    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(foobarTransformed, Route.decode("/foo/foo-1/bar/bar-2")), { foo: 1, bar: 2 })
      deepEqual(yield* _(foobarTransformed, Route.encode({ foo: 1, bar: 2 })), "/foo/foo-1/bar/bar-2")
    })

    await Effect.runPromise(test)
  })

  it("separates path and query schemas", () => {
    const route = Route.literal("/foo").concat(Route.param("fooId"), Route.queryParams({ bar: Route.integer("bar") }))
    const { pathSchema, querySchema } = route

    const decodePath = Schema.decode(pathSchema)
    const decodeQuery = Schema.decode(querySchema)
    const decode = Route.decode_(route)

    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(decodePath({ fooId: "1" })), { fooId: "1" })
      deepEqual(yield* _(decodeQuery({ bar: "1" })), { bar: 1 })
      deepEqual(yield* _(decode(`/foo/1?bar=1`)), { fooId: "1", bar: 1 })
    })

    return Effect.runPromise(test)
  })

  it("matches with query params", () => {
    const route = Route.home.concat(
      Route.queryParams({
        tag: Route.param("tag").optional(),
        author: Route.param("author").optional(),
        favorited: Route.param("favorited").optional(),
        limit: Route.param("limit").optional(),
        offset: Route.param("offset").optional()
      })
    )

    deepEqual(route.match("/"), Option.some({}))
    deepEqual(route.match("/?tag=foo"), Option.some({ tag: "foo" }))
    deepEqual(route.match("/?tag=foo&author=bar"), Option.some({ tag: "foo", author: "bar" }))
    deepEqual(
      route.match("/?tag=foo&author=bar&favorited=baz"),
      Option.some({ tag: "foo", author: "bar", favorited: "baz" })
    )
    deepEqual(
      route.match("/?tag=foo&author=bar&favorited=baz&limit=10"),
      Option.some({ tag: "foo", author: "bar", favorited: "baz", limit: "10" })
    )
    deepEqual(
      route.match("/?tag=foo&author=bar&favorited=baz&limit=10&offset=20"),
      Option.some({ tag: "foo", author: "bar", favorited: "baz", limit: "10", offset: "20" })
    )
    deepEqual(
      route.match("/?tag=foo&author=bar&favorited=baz&limit=10&offset=20&extra=extra"),
      Option.some({ tag: "foo", author: "bar", favorited: "baz", limit: "10", offset: "20" })
    )
  })

  it("allows concatenation of routes with query params", () => {
    const foobar = Route.literal("foo").concat(Route.queryParams({ bar: Route.integer("bar").optional() }))
    const bazQuux = Route.literal("baz").concat(Route.queryParams({ quux: Route.integer("quux").optional() }))
    const route = foobar.concat(bazQuux)

    deepEqual(route.path, "/foo/baz\\?bar=:bar?&quux=:quux?")

    const { pathSchema, querySchema } = route

    const decodePath = Schema.decode(pathSchema)
    const decodeQuery = Schema.decode(querySchema)

    const test = Effect.gen(function*(_) {
      deepEqual(yield* _(decodePath({})), {})
      deepEqual(yield* _(decodeQuery({ bar: "1" })), { bar: 1 })
      deepEqual(yield* _(decodeQuery({ quux: "2" })), { quux: 2 })
      deepEqual(yield* _(decodeQuery({ bar: "1", quux: "2" })), { bar: 1, quux: 2 })
    })

    return Effect.runPromise(test)
  })

  it("can be ordered by complexity", () => {
    const articles = Route.literal("articles")
    const article = Route.literal("articles").concat(Route.param("slug"))
    const feed = articles.concat(Route.literal("feed"))
    const favorites = article.concat(Route.literal("favorite"))
    const comments = article.concat(Route.literal("comments"))
    const comment = comments.concat(Route.param("id"))
    const routes = [articles, article, feed, favorites, comments, comment]
    const expected = [
      feed,
      comment,
      favorites,
      comments,
      article,
      articles
    ]

    deepEqual(Route.sortRoutes(routes).map((r) => r.path), expected.map((r) => r.path))
  })
})
