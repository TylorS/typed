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
    testInterpolation(foobar, { fooId: "1", barId: "2" }, `/foo/foo-1/bar/bar-2`)
    testInterpolation(baz, { fooId: "1", barId: "2" }, `/foo/foo-1/bar/bar-2`)
    testInterpolation(baz, { fooId: "1", barId: "2", baz: "3" }, `/foo/foo-1/bar/bar-2?baz=3`)
    testInterpolation(baz, { fooId: "1", barId: "2", quux: "4" }, `/foo/foo-1/bar/bar-2?quux=4`)
    testInterpolation(baz, { fooId: "1", barId: "2", baz: "3", quux: "4" }, `/foo/foo-1/bar/bar-2?baz=3&quux=4`)
    testInterpolation(unnamed, { 0: "123", 1: "456" }, `/test/123/test2/456`)
    testInterpolation(param, { test: "test" }, `/test`)
    testInterpolation(zeroOrMore, { test: ["test", "test"] }, `/test/test`)
    testInterpolation(zeroOrMore, { test: [] }, `/`)
    testInterpolation(oneOrMore, { test: ["test"] }, `/test`)
    testInterpolation(oneOrMore, { test: ["a", "b"] }, `/a/b`)
    testInterpolation(optional, { test: "test" }, `/test`)
    testInterpolation(optional, {}, `/`)

    // Literal
    testInterpolation(Route.literal("test"), {}, `/test`)
  })

  it("Can derive match", () => {
    testMatcher(foobar, `/foo/foo-1/bar/bar-2`, Option.some({ fooId: "1", barId: "2" }))
    testMatcher(unnamed, `/test/123/test2/456`, Option.some({ 0: "123", 1: "456" }))
    testMatcher(param, `/test`, Option.some({ test: "test" }))
    testMatcher(zeroOrMore, `/test/test`, Option.some({ test: ["test", "test"] }))
    testMatcher(oneOrMore, `/test`, Option.some({ test: ["test"] } as const))
    testMatcher(optional, `/test`, Option.some({ test: "test" }))
    testMatcher(optional, `/`, Option.some({}))
    testMatcher(baz, `/foo/foo-1/bar/bar-2`, Option.some({ fooId: "1", barId: "2" }))
    testMatcher(baz, `/foo/foo-1/bar/bar-2?baz=3`, Option.some({ fooId: "1", barId: "2", baz: "3" }))
    testMatcher(baz, `/foo/foo-1/bar/bar-2?quux=4`, Option.some({ fooId: "1", barId: "2", quux: "4" }))
    testMatcher(
      baz,
      `/foo/foo-1/bar/bar-2?baz=3&quux=4`,
      Option.some({ fooId: "1", barId: "2", baz: "3", quux: "4" })
    )
  })
})

function testInterpolation<R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>,
  expected: string
) {
  const interpolation = AST.astToInterpolation(route.routeAst)
  if (interpolation._tag === "Literal") {
    deepEqual(interpolation.value, expected)
  } else {
    deepEqual(interpolation.interpolate(params), expected)
  }
}

function testMatcher<R extends Route.Route.Any>(
  route: R,
  path: string,
  expected: Option.Option<Route.Route.Params<R>>
) {
  deepEqual(AST.astToMatcher(route.routeAst, false)(...AST.getPathAndQuery(path)), expected)
}
