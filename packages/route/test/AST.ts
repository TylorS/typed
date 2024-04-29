import { describe, it } from "@effect/vitest"
import * as AST from "@typed/route/AST"
import type { InterpolateParam } from "@typed/route/interpolate"
import { astToInterpolation } from "@typed/route/interpolate"
import { astToMatcher } from "@typed/route/match"
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

    // Compiled interpolation

    const foobarPart = astToInterpolation(foobar.routeAst) as InterpolateParam
    deepEqual(foobarPart.interpolate({ fooId: "1", barId: "2" }), `/foo/foo-1/bar/bar-2`)

    const bazPart = astToInterpolation(baz.routeAst) as InterpolateParam
    deepEqual(bazPart.interpolate({ fooId: "1", barId: "2", baz: "3", quux: "4" }), `/foo/foo-1/bar/bar-2?baz=3&quux=4`)

    deepEqual(bazPart.interpolate({ fooId: "1", barId: "2", baz: "3" }), `/foo/foo-1/bar/bar-2?baz=3`)
    deepEqual(bazPart.interpolate({ fooId: "1", barId: "2", quux: "4" }), `/foo/foo-1/bar/bar-2?quux=4`)

    const unnamedPart = astToInterpolation(unnamed.routeAst) as InterpolateParam
    deepEqual(unnamedPart.interpolate({ 0: "123", 1: "456" }), `/test/123/test2/456`)

    const paramPart = astToInterpolation(param.routeAst) as InterpolateParam
    deepEqual(paramPart.interpolate({ test: "test" }), `/test`)

    const zeroOrMorePart = astToInterpolation(zeroOrMore.routeAst) as InterpolateParam
    deepEqual(zeroOrMorePart.interpolate({ test: ["test", "test"] }), `/test/test`)
    deepEqual(zeroOrMorePart.interpolate({ test: [] }), `/`)

    const oneOrMorePart = astToInterpolation(oneOrMore.routeAst) as InterpolateParam
    deepEqual(oneOrMorePart.interpolate({ test: ["test"] }), `/test`)

    const optionalPart = astToInterpolation(optional.routeAst) as InterpolateParam
    deepEqual(optionalPart.interpolate({ test: "test" }), `/test`)
    deepEqual(optionalPart.interpolate({}), `/`)

    // Literal
    deepEqual(astToInterpolation(Route.literal("test").routeAst), { _tag: "Literal", value: "/test" })
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
    console.time("non-compiled")
    deepEqual(
      AST.match(baz.routeAst, `/foo/foo-1/bar/bar-2?baz=3&quux=4`),
      Option.some({ fooId: "1", barId: "2", baz: "3", quux: "4" })
    )
    console.timeEnd("non-compiled")

    // Compiled match

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
      Option.some({ fooId: "1", barId: "2", baz: "3", quux: "4" }),
      "compiled"
    )
  })
})

function testMatcher<R extends Route.Route.Any>(
  route: R,
  path: string,
  expected: Option.Option<Route.Route.Params<R>>,
  name?: string
) {
  const matcher = astToMatcher(route.routeAst)
  const { pathname, searchParams } = new URL(path, "http://localhost")
  const pathSegments = pathname.split(/\//g)
  if (pathSegments[0] === "") {
    pathSegments.shift()
  }

  if (name) {
    console.time(name)
    const out = matcher(pathSegments, searchParams)
    console.timeEnd(name)
    deepEqual(out, expected)
  } else {
    deepEqual(matcher(pathSegments, searchParams), expected)
  }
}
