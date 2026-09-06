import { describe, expect, it } from "vitest";
import * as AST from "../AST.js";
import { makePathRouter } from "../internal/PathRouter.js";

describe("PathRouter", () => {
  it("prefers literal, constrained, parameter, then wildcard paths", () => {
    const router = makePathRouter<string>();
    router.on([AST.wildcard()], "wildcard");
    router.on([AST.parameter("value")], "parameter");
    router.on([AST.parameter("value", undefined, "\\d+")], "constrained");
    router.on([AST.literal("42")], "literal");

    expect(router.find("/42?source=test")?.handler).toBe("literal");
    expect(router.find("/7")?.handler).toBe("constrained");
    expect(router.find("/word")?.handler).toBe("parameter");
    expect(router.find("/one/two")?.handler).toBe("wildcard");
  });

  it("matches case-insensitively and ignores a trailing slash", () => {
    const router = makePathRouter<string>();
    router.on([AST.literal("ABOUT")], "about");

    expect(router.find("/about/")?.handler).toBe("about");
  });

  it("captures path and repeated query parameters", () => {
    const router = makePathRouter<string>();
    router.on(
      [AST.literal("users"), AST.slash(), AST.parameter("id"), AST.slash(), AST.wildcard()],
      "user",
    );

    expect(router.find("/users/42/profile/avatar?view=full&tag=a&tag=b")).toEqual({
      handler: "user",
      params: { id: "42", "*": "profile/avatar" },
      searchParams: { view: "full", tag: ["a", "b"] },
    });
  });

  it("rejects a non-terminal wildcard", () => {
    const router = makePathRouter<string>();

    expect(() => router.on([AST.wildcard(), AST.slash(), AST.literal("edit")], "invalid")).toThrow(
      /wildcard/i,
    );
  });
});
