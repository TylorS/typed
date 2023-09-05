import { deepStrictEqual } from "assert"

import { describe, it } from "vitest"

import { pathJoin } from "@typed/path"

describe(__filename, () => {
  describe(pathJoin.name, () => {
    it("joins standard paths", () => {
      deepStrictEqual(pathJoin("a", "b", "c"), "/a/b/c")
      deepStrictEqual(pathJoin("a", "/b", "c"), "/a/b/c")
      deepStrictEqual(pathJoin("a", "/b", "/c"), "/a/b/c")
      deepStrictEqual(pathJoin("/a", "/b", "/c"), "/a/b/c")
    })

    it("joins parameterized paths", () => {
      deepStrictEqual(pathJoin("a", ":b", "c"), "/a/:b/c")
      deepStrictEqual(pathJoin("a", ":b", ":c"), "/a/:b/:c")
      deepStrictEqual(pathJoin(":a", ":b", ":c"), "/:a/:b/:c")
      deepStrictEqual(pathJoin("a", ":b", "/c"), "/a/:b/c")
      deepStrictEqual(pathJoin("a", "/:b", "c"), "/a/:b/c")
      deepStrictEqual(pathJoin("a", "/:b", "/c"), "/a/:b/c")
      deepStrictEqual(pathJoin("/a", "/:b", "/c"), "/a/:b/c")
    })

    it("removes empty paths", () => {
      deepStrictEqual(pathJoin("a", "", "c"), "/a/c")
    })

    it("removes trailing slashes", () => {
      deepStrictEqual(pathJoin("a", "b", "c/"), "/a/b/c")
      deepStrictEqual(pathJoin("a", "b/", "c"), "/a/b/c")
      deepStrictEqual(pathJoin("a/", "b", "c"), "/a/b/c")
      deepStrictEqual(pathJoin("a/", "b/", "c"), "/a/b/c")
      deepStrictEqual(pathJoin("a/", "b////", "c/"), "/a/b/c")
    })
  })
})
