import { describe, expect, it } from "vitest";

import * as AST from "../AST.js";
import * as Path from "../Path.js";

describe("typed/router/Path", () => {
  describe("parseWithRest", () => {
    it("parses literals and parameters", () => {
      const [asts, rest] = Path.parseWithRest("/users/:id");

      expect(asts).toEqual([AST.literal("users"), AST.slash(), AST.parameter("id")]);
      expect(rest).toEqual("");
    });

    it("parses wildcard segments", () => {
      const [asts, rest] = Path.parseWithRest("/files/*");

      expect(asts).toEqual([AST.literal("files"), AST.slash(), AST.wildcard()]);
      expect(rest).toEqual("");
    });

    it("parses parameters with regex and optional mark", () => {
      const [asts, rest] = Path.parseWithRest("/:id(\\d+)?");

      expect(asts).toEqual([AST.parameter("id", true, "\\d+")]);
      expect(rest).toEqual("");
    });

    it("emits slash AST nodes only when a '/' actually separates atoms", () => {
      expect(Path.parseWithRest("*foo")[0]).toEqual([AST.wildcard(), AST.literal("foo")]);
      expect(Path.parseWithRest("*/foo")[0]).toEqual([
        AST.wildcard(),
        AST.slash(),
        AST.literal("foo"),
      ]);
    });

    it("parses query params with literal, parameter, and wildcard values", () => {
      const [asts, rest] = Path.parseWithRest("/search?term=:term&limit=10&rest=*");

      expect(asts).toEqual([
        AST.literal("search"),
        AST.queryParams([
          AST.queryParam("term", AST.parameter("term")),
          AST.queryParam("limit", AST.literal("10")),
          AST.queryParam("rest", AST.wildcard()),
        ]),
      ]);
      expect(rest).toEqual("");
    });

    it("stops parsing query params when a tail param can't be parsed, leaving '&' for the outer parser", () => {
      const [asts, rest] = Path.parseWithRest("/?a=b&");

      expect(asts).toEqual([
        AST.queryParams([AST.queryParam("a", AST.literal("b"))]),
        AST.literal("&"),
      ]);
      expect(rest).toEqual("");
    });

    it("parses multiple path segments", () => {
      const [asts, rest] = Path.parseWithRest("/api/v1/users/:userId/posts/:postId");

      expect(asts).toEqual([
        AST.literal("api"),
        AST.slash(),
        AST.literal("v1"),
        AST.slash(),
        AST.literal("users"),
        AST.slash(),
        AST.parameter("userId"),
        AST.slash(),
        AST.literal("posts"),
        AST.slash(),
        AST.parameter("postId"),
      ]);
      expect(rest).toEqual("");
    });

    it("parses parameter with regex only (no optional)", () => {
      const [asts, rest] = Path.parseWithRest("/:id(\\d+)");

      expect(asts).toEqual([AST.parameter("id", undefined, "\\d+")]);
      expect(rest).toEqual("");
    });

    it("parses optional parameter without regex", () => {
      const [asts, rest] = Path.parseWithRest("/:id?");

      expect(asts).toEqual([AST.parameter("id", true)]);
      expect(rest).toEqual("");
    });

    it("treats a question mark followed by a query declaration as the query delimiter", () => {
      const [asts, rest] = Path.parseWithRest("/:id?q=:term");

      expect(asts).toEqual([
        AST.parameter("id"),
        AST.queryParams([AST.queryParam("q", AST.parameter("term"))]),
      ]);
      expect(rest).toEqual("");
    });

    it("uses two question marks for an optional parameter followed by a query declaration", () => {
      const [asts, rest] = Path.parseWithRest("/:id??q=:term");

      expect(asts).toEqual([
        AST.parameter("id", true),
        AST.queryParams([AST.queryParam("q", AST.parameter("term"))]),
      ]);
      expect(rest).toEqual("");
    });

    it("parses consecutive parameters", () => {
      const [asts, rest] = Path.parseWithRest("/:a:b");

      expect(asts).toEqual([AST.parameter("a"), AST.parameter("b")]);
      expect(rest).toEqual("");
    });

    it("parses mixed slashes", () => {
      const [asts, rest] = Path.parseWithRest("//users///profile");

      expect(asts).toEqual([AST.literal("users"), AST.slash(), AST.literal("profile")]);
      expect(rest).toEqual("");
    });

    it("parses empty string", () => {
      const [asts, rest] = Path.parseWithRest("");

      expect(asts).toEqual([]);
      expect(rest).toEqual("");
    });

    it("handles trailing slashes", () => {
      const [asts, rest] = Path.parseWithRest("/users/");

      expect(asts).toEqual([AST.literal("users")]);
      expect(rest).toEqual("/");
    });

    it("parses single query param", () => {
      const [asts, rest] = Path.parseWithRest("?foo=bar");

      expect(asts).toEqual([AST.queryParams([AST.queryParam("foo", AST.literal("bar"))])]);
      expect(rest).toEqual("");
    });

    it("parses multiple query params", () => {
      const [asts, rest] = Path.parseWithRest("?foo=bar&baz=qux");

      expect(asts).toEqual([
        AST.queryParams([
          AST.queryParam("foo", AST.literal("bar")),
          AST.queryParam("baz", AST.literal("qux")),
        ]),
      ]);
      expect(rest).toEqual("");
    });

    it("parses path with query params containing parameters", () => {
      const [asts, rest] = Path.parseWithRest("/users?id=:id&name=:name");

      expect(asts).toEqual([
        AST.literal("users"),
        AST.queryParams([
          AST.queryParam("id", AST.parameter("id")),
          AST.queryParam("name", AST.parameter("name")),
        ]),
      ]);
      expect(rest).toEqual("");
    });
  });

  describe("parse", () => {
    it("accepts a root path", () => {
      expect(Path.parse("/")).toEqual([]);
    });

    it("throws when unparsed rest contains non-slash characters", () => {
      expect(() => Path.parse("/:")).toThrow();
    });

    it("parses simple path", () => {
      expect(Path.parse("/users")).toEqual([AST.literal("users")]);
    });

    it("parses path with parameter", () => {
      expect(Path.parse("/users/:id")).toEqual([
        AST.literal("users"),
        AST.slash(),
        AST.parameter("id"),
      ]);
    });

    it("parses path with wildcard", () => {
      expect(Path.parse("/files/*")).toEqual([AST.literal("files"), AST.slash(), AST.wildcard()]);
    });

    it("accepts trailing slashes", () => {
      expect(Path.parse("/users/")).toEqual([AST.literal("users")]);
      expect(Path.parse("/users///")).toEqual([AST.literal("users")]);
    });

    it("throws on invalid parameter syntax", () => {
      expect(() => Path.parse("/users/:")).toThrow();
    });

    it("throws on unclosed regex", () => {
      expect(() => Path.parse("/:id(abc")).toThrow();
    });
  });

  describe("join", () => {
    it("joins literal ASTs", () => {
      expect(Path.join([AST.literal("users")])).toEqual("/users");
    });

    it("joins literal with slash and parameter", () => {
      expect(Path.join([AST.literal("users"), AST.slash(), AST.parameter("id")])).toEqual(
        "/users/:id",
      );
    });

    it("joins with wildcard", () => {
      expect(Path.join([AST.literal("files"), AST.slash(), AST.wildcard()])).toEqual("/files/*");
    });

    it("joins with optional parameter", () => {
      const ast = AST.parameter("id", true);
      expect(Path.join([ast])).toEqual("/:id?");
    });

    it("joins with regex parameter", () => {
      const ast = AST.parameter("id", undefined, "\\d+");
      expect(Path.join([ast])).toEqual("/:id(\\d+)");
    });

    it("joins with optional regex parameter", () => {
      const ast = AST.parameter("id", true, "\\d+");
      expect(Path.join([ast])).toEqual("/:id(\\d+)?");
    });

    it("joins with query params", () => {
      expect(
        Path.join([
          AST.literal("search"),
          AST.queryParams([
            AST.queryParam("term", AST.parameter("term")),
            AST.queryParam("limit", AST.literal("10")),
          ]),
        ]),
      ).toEqual("/search?term=:term&limit=10");
    });

    it("joins empty array", () => {
      expect(Path.join([])).toEqual("/");
    });

    it("joins multiple slashes", () => {
      expect(Path.join([AST.slash(), AST.literal("a"), AST.slash(), AST.slash()])).toEqual("//a//");
    });
  });

  describe("getSchemaFields", () => {
    it("extracts parameter fields", () => {
      const result = Path.getSchemaFields([AST.parameter("id"), AST.parameter("name")]);

      expect(result.requiredFields.map(([name]) => name)).toEqual(["id", "name"]);
      expect(result.optionalFields).toEqual([]);
      expect(result.queryParams).toEqual([]);
    });

    it("extracts optional parameter fields", () => {
      const result = Path.getSchemaFields([AST.parameter("id", true)]);

      expect(result.requiredFields).toEqual([]);
      expect(result.optionalFields.length).toEqual(1);
    });

    it("extracts wildcard as required field", () => {
      const result = Path.getSchemaFields([AST.wildcard()]);

      expect(result.requiredFields.map(([name]) => name)).toEqual(["*"]);
    });

    it("extracts query params", () => {
      const result = Path.getSchemaFields([
        AST.queryParams([AST.queryParam("foo", AST.parameter("bar"))]),
      ]);

      expect(result.queryParams.length).toEqual(1);
      expect(result.queryParams[0][0]).toEqual("foo");
    });

    it("ignores literals and slashes", () => {
      const result = Path.getSchemaFields([AST.literal("users"), AST.slash()]);

      expect(result.requiredFields).toEqual([]);
      expect(result.optionalFields).toEqual([]);
      expect(result.queryParams).toEqual([]);
    });

    it("handles parameter with regex", () => {
      const result = Path.getSchemaFields([AST.parameter("id", undefined, "\\d+")]);

      expect(result.requiredFields.length).toEqual(1);
      expect(result.requiredFields[0][0]).toEqual("id");
    });
  });

  describe("getSchemas", () => {
    it("creates path schema for parameters", () => {
      const result = Path.getSchemas([AST.parameter("id")]);

      expect(result.pathSchema).toBeDefined();
      expect(result.querySchema).toBeDefined();
      expect(result.paramsSchema).toBeDefined();
    });

    it("creates schemas for path with query params", () => {
      const result = Path.getSchemas([
        AST.literal("search"),
        AST.queryParams([AST.queryParam("term", AST.parameter("term"))]),
      ]);

      expect(result.pathSchema).toBeDefined();
      expect(result.querySchema).toBeDefined();
      expect(result.paramsSchema).toBeDefined();
    });

    it("creates schemas for wildcard", () => {
      const result = Path.getSchemas([AST.wildcard()]);

      expect(result.pathSchema).toBeDefined();
    });

    it("creates schemas for empty path", () => {
      const result = Path.getSchemas([]);

      expect(result.pathSchema).toBeDefined();
      expect(result.querySchema).toBeDefined();
      expect(result.paramsSchema).toBeDefined();
    });
  });
});
