import { Test } from "ts-toolbelt"
import { assertType, describe, it } from "vitest"

import type { Interpolate } from "@typed/path"
import { pathJoin } from "@typed/path"

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

  describe("Interpolate", () => {
    it("interpolates paths", () => {
      type Path = "/a/:b/c"

      Test.checks([
        Test.check<Interpolate<Path, { b: "b" }>, "/a/b/c", Test.Pass>(),
        Test.check<Interpolate<Path, { b: "b"; c: "c" }>, "/a/b/c", Test.Pass>(),
        Test.check<Interpolate<Path, { b: "foo" }>, "/a/foo/c", Test.Pass>()
      ])
    })
  })
})
