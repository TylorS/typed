import { Test } from "ts-toolbelt"
import { assertType, describe, it } from "vitest"

import { pathJoin } from "@typed/path"
import type { Interpolate, ParamsOf } from "@typed/path"

describe(__filename, () => {
  describe(pathJoin.name, () => {
    describe("type-level", () => {
      it("joins paths", () => {
        assertType<"/a/b/c">(pathJoin("a", "b", "c"))
        assertType<"/a/b/c">(pathJoin("a", "/b", "c"))
        assertType<"/a/b/c">(pathJoin("a", "/b", "/c"))
        assertType<"/a/b/c">(pathJoin("/a", "/b", "/c"))

        assertType<"/a/:b/c">(pathJoin("a", ":b", "c"))
        assertType<"/a/:b/:c">(pathJoin("a", ":b", ":c"))
        assertType<"/:a/:b/:c">(pathJoin(":a", ":b", ":c"))
        assertType<"/a/:b/c">(pathJoin("a", ":b", "/c"))
        assertType<"/a/:b/c">(pathJoin("a", "/:b", "c"))
        assertType<"/a/:b/c">(pathJoin("a", "/:b", "/c"))
        assertType<"/a/:b/c">(pathJoin("/a", "/:b", "/c"))

        assertType<"/a/c">(pathJoin("a", "", "c"))

        assertType<"/a/b/c">(pathJoin("a", "b", "c/"))
        assertType<"/a/b/c">(pathJoin("a", "b///", "c"))
      })
    })
  })

  describe("Params", () => {
    it("parses params", () => {
      Test.checks([
        // Params
        Test.check<ParamsOf<"/a/:b/c/:d">, { readonly b: string; readonly d: string }, Test.Pass>(),
        Test.check<ParamsOf<"/a/:b/c">, { readonly b: string }, Test.Pass>(),
        Test.check<ParamsOf<"/a/c">, {}, Test.Pass>(),
        // Optional params
        Test.check<ParamsOf<"/a/:b/c/:d?">, { readonly b: string; readonly d?: string }, Test.Pass>(),
        // Zero or more
        Test.check<ParamsOf<"/a/:foo*">, { readonly foo: ReadonlyArray<string> }, Test.Pass>(),
        // One or more
        Test.check<ParamsOf<"/a/:foo+">, { readonly foo: readonly [string, ...Array<string>] }, Test.Pass>(),
        // Unamed
        Test.check<ParamsOf<"/a/(.*)/(.*)">, { readonly 0: string; readonly 1: string }, Test.Pass>(),
        // Optional unamed
        Test.check<ParamsOf<"/a/(.*)/(.*)?">, { readonly 0: string; readonly 1?: string }, Test.Pass>(),
        // Zero or more unamed
        Test.check<ParamsOf<"/a/(.*)*">, { readonly 0: ReadonlyArray<string> }, Test.Pass>(),
        // One or more unamed
        Test.check<ParamsOf<"/a/(.*)+">, { readonly 0: readonly [string, ...Array<string>] }, Test.Pass>(),
        // Prefix
        Test.check<ParamsOf<"/a{-:foo}">, { readonly foo: string }, Test.Pass>(),
        // Optional prefix
        Test.check<ParamsOf<"/a{-:foo}?">, { readonly foo?: string }, Test.Pass>(),
        // Zero or more prefix
        Test.check<ParamsOf<"/a{-:foo}*">, { readonly foo: ReadonlyArray<string> }, Test.Pass>(),
        // One or more prefix
        Test.check<ParamsOf<"/a{-:foo}+">, { readonly foo: readonly [string, ...Array<string>] }, Test.Pass>(),
        // Supported values
        Test.check<ParamsOf<"/a/:foo(json|xml)">, { readonly foo: string }, Test.Pass>(),
        // Supported values with optional
        Test.check<ParamsOf<"/a/:foo(json|xml)?">, { readonly foo?: string }, Test.Pass>(),
        // Supported values with zero or more
        Test.check<ParamsOf<"/a/:foo(json|xml)*">, { readonly foo: ReadonlyArray<string> }, Test.Pass>(),
        // Supported values with one or more
        Test.check<
          ParamsOf<"/a/:foo(json|xml)+">,
          { readonly foo: readonly [string, ...Array<string>] },
          Test.Pass
        >(),
        // Handles escaped values
        Test.check<ParamsOf<"/:foo\\?">, { readonly foo: string }, Test.Pass>(),
        Test.check<ParamsOf<"/:foo+baz">, { readonly foo: readonly [string, ...Array<string>] }, Test.Pass>(),
        // Support query params
        Test.check<
          ParamsOf<"/a\\?foo=:foo&baz=:bar">,
          { readonly foo: string; readonly bar: string },
          Test.Pass
        >()
      ])
    })
  })

  describe("Interpolate", () => {
    it("interpolates paths", () => {
      Test.checks([
        Test.check<Interpolate<"/a/:b/c", { b: "b" }>, "/a/b/c", Test.Pass>(),
        Test.check<Interpolate<"/a/:b/c", { b: "b"; c: "c" }>, "/a/b/c", Test.Pass>(),
        Test.check<Interpolate<"/a/:b/c", { b: "foo" }>, "/a/foo/c", Test.Pass>(),
        // Optional params
        Test.check<Interpolate<"/a/:b/c/:d?", { b: "b" }>, "/a/b/c", Test.Pass>(),
        Test.check<Interpolate<"/a/:b/c/:d?", { b: "b"; d: "d" }>, "/a/b/c/d", Test.Pass>(),
        // Zero or more
        Test.check<Interpolate<"/a/:foo*", { foo: [] }>, "/a", Test.Pass>(),
        Test.check<Interpolate<"/a/:foo*", { foo: ["b"] }>, "/a/b", Test.Pass>(),
        // One or more
        Test.check<Interpolate<"/a/:foo+", { foo: ["b"] }>, "/a/b", Test.Pass>(),
        Test.check<Interpolate<"/a/:foo+", { foo: ["b", "c"] }>, "/a/b/c", Test.Pass>(),
        // Unamed
        Test.check<Interpolate<"/a/(.*)/(.*)", ["b", "c"]>, "/a/b/c", Test.Pass>(),
        // Optional unamed
        Test.check<Interpolate<"/a/(.*)/(.*)?", { 0: "b" }>, "/a/b", Test.Pass>(),
        Test.check<Interpolate<"/a/(.*)/(.*)?", { 0: "b"; 1: "c" }>, "/a/b/c", Test.Pass>(),
        // Zero or more unamed
        Test.check<Interpolate<"/a/(.*)*", { 0: [] }>, "/a", Test.Pass>(),
        Test.check<Interpolate<"/a/(.*)*", { 0: ["b"] }>, "/a/b", Test.Pass>(),
        // One or more unamed
        Test.check<Interpolate<"/a/(.*)+", { 0: ["b"] }>, "/a/b", Test.Pass>(),
        Test.check<Interpolate<"/a/(.*)+", { 0: ["b", "c"] }>, "/a/b/c", Test.Pass>(),
        // Prefix
        Test.check<Interpolate<"/a{-:foo}", { foo: "b" }>, "/a-b", Test.Pass>(),
        // Optional prefix
        Test.check<Interpolate<"/a{-:foo}?", { foo: "b" }>, "/a-b", Test.Pass>(),
        Test.check<Interpolate<"/a{-:foo}?", {}>, "/a", Test.Pass>(),
        // Zero or more prefix
        Test.check<Interpolate<"/a{-:foo}*", { foo: [] }>, "/a", Test.Pass>(),
        Test.check<Interpolate<"/a{-:foo}*", { foo: ["b"] }>, "/a-b", Test.Pass>(),
        // One or more prefix
        Test.check<Interpolate<"/a{-:foo}+", { foo: ["b"] }>, "/a-b", Test.Pass>(),
        Test.check<Interpolate<"/a{-:foo}+", { foo: ["b", "c"] }>, "/a-b-c", Test.Pass>()
      ])
    })
  })
})
