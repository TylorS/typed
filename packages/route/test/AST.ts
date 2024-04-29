import { describe, it } from "@effect/vitest"
import * as AST from "@typed/route/AST"
import * as Route from "@typed/route/Route"
import { deepEqual } from "assert"
import { Option } from "effect"

describe("AST", () => {
  const foo = Route.literal("foo").concat(Route.end, Route.integer("fooId").prefix("foo-"))
  const bar = Route.literal("bar").concat(Route.end, Route.integer("barId").prefix("bar-"))
  const foobar = foo.concat(bar)

  const unnamed = Route.literal(`test`).concat(Route.unnamed, Route.literal("test2"), Route.unnamed)
  const param = Route.param("test")
  const zeroOrMore = param.zeroOrMore()
  const oneOrMore = param.oneOrMore()
  const optional = param.optional()

  const baz = foobar.concat(
    Route.queryParams({ baz: Route.integer("baz").optional(), quux: Route.integer("quux").optional() })
  )

  it("Can derive interpolate", () => {
    deepEqual(AST.interpolate(foobar.routeAst, { fooId: "1", barId: "2" }), `/foo/foo-1/bar/bar-2`)

    deepEqual(
      AST.interpolate(baz.routeAst, { fooId: "1", barId: "2", baz: "3", quux: "4" }),
      `/foo/foo-1/bar/bar-2?baz=3&quux=4`
    )
    deepEqual(AST.interpolate(baz.routeAst, { fooId: "1", barId: "2", baz: "3" }), `/foo/foo-1/bar/bar-2?baz=3`)
    deepEqual(AST.interpolate(baz.routeAst, { fooId: "1", barId: "2", quux: "4" }), `/foo/foo-1/bar/bar-2?quux=4`)

    deepEqual(AST.interpolate(unnamed.routeAst, { 0: "123", 1: "456" }), `/test/123/test2/456`)

    deepEqual(AST.interpolate(param.routeAst, { test: "test" }), `/test`)
    deepEqual(AST.interpolate(zeroOrMore.routeAst, { test: ["test", "test"] }), `/test/test`)
    deepEqual(AST.interpolate(oneOrMore.routeAst, { test: ["test"] }), `/test`)
    deepEqual(AST.interpolate(optional.routeAst, { test: "test" }), `/test`)
    deepEqual(AST.interpolate(optional.routeAst, {}), `/`)
  })

  it("Can derive match", () => {
    deepEqual(AST.match(foobar.routeAst, `/foo/foo-1/bar/bar-2`), Option.some({ fooId: "1", barId: "2" }))
    deepEqual(AST.match(unnamed.routeAst, `/test/123/test2/456`), Option.some({ 0: "123", 1: "456" }))
    deepEqual(AST.match(param.routeAst, `/test`), Option.some({ test: "test" }))
    deepEqual(AST.match(zeroOrMore.routeAst, `/test/test`), Option.some({ test: ["test", "test"] }))
    deepEqual(AST.match(oneOrMore.routeAst, `/test`), Option.some({ test: ["test"] }))
    deepEqual(AST.match(optional.routeAst, `/test`), Option.some({ test: "test" }))
    deepEqual(AST.match(optional.routeAst, `/`), Option.some({}))
    deepEqual(AST.match(baz.routeAst, `/foo/foo-1/bar/bar-2`), Option.some({ fooId: "1", barId: "2" }))
    deepEqual(AST.match(baz.routeAst, `/foo/foo-1/bar/bar-2?baz=3`), Option.some({ fooId: "1", barId: "2", baz: "3" }))
    deepEqual(
      AST.match(baz.routeAst, `/foo/foo-1/bar/bar-2?quux=4`),
      Option.some({ fooId: "1", barId: "2", quux: "4" })
    )
    deepEqual(
      AST.match(baz.routeAst, `/foo/foo-1/bar/bar-2?baz=3&quux=4`),
      Option.some({ fooId: "1", barId: "2", baz: "3", quux: "4" })
    )
  })
})
