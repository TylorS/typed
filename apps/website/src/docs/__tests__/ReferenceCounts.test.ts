import { describe, expect, it } from "vitest";
import { countUniqueExports } from "../Reference.js";

describe("reference counts", () => {
  it("counts one unique export when several import paths expose the same declaration", () => {
    expect(
      countUniqueExports([
        {
          recordKind: "declaration",
          id: "@typed/example#shared",
          declarationKey: "declaration:shared",
        },
        {
          recordKind: "declaration",
          id: "@typed/example/subpath#shared",
          declarationKey: "declaration:shared",
        },
        {
          recordKind: "resource",
          id: "@typed/example/config#$resource",
        },
      ]),
    ).toBe(2);
  });
});
