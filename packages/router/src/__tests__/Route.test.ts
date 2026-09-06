import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";
import * as Transformation from "effect/SchemaTransformation";
import * as AST from "../AST.js";
import * as Route from "../Route.js";

describe("typed/router/Route", () => {
  describe("Parse", () => {
    it("creates route from literal string", () => {
      const route = Route.Parse("users");

      expect(route.path).toEqual("/users");
      expect(route.ast.type).toEqual("path");
    });

    it("creates route from multi-segment literal", () => {
      const route = Route.Parse("api/v1/users");

      expect(route.path).toEqual("/api/v1/users");
    });

    it("renders query declarations without inserting a path separator", () => {
      const route = Route.Parse("/search?q=:term&mode=all");

      expect(route.path).toEqual("/search?q=:term&mode=all");
    });

    it("preserves regex and optional syntax in the route path", () => {
      const route = Route.Parse("/users/:id(\\d+)?");
      const path: "/users/:id(\\d+)?" = route.path;

      expect(path).toEqual("/users/:id(\\d+)?");
    });

    it("keeps a terminal path parameter required before a query declaration", () => {
      const route = Route.Parse("/users/:id?q=:term");
      const path: "/users/:id?q=:term" = route.path;
      const params: Route.Params<typeof route> = { id: "1", term: "hello" };

      expect(path).toEqual("/users/:id?q=:term");
      expect(params).toEqual({ id: "1", term: "hello" });
    });

    it("parses an optional terminal path parameter before a query declaration", () => {
      const route = Route.Parse("/users/:id??q=:term");
      const path: "/users/:id??q=:term" = route.path;
      const params: Route.Params<typeof route> = { term: "hello" };

      expect(path).toEqual("/users/:id??q=:term");
      expect(params).toEqual({ term: "hello" });
    });

    it("handles empty string as root", () => {
      expect(Route.Parse("").path).toEqual("/");
    });
  });

  describe("slash", () => {
    it("creates root route", () => {
      expect(Route.Slash.path).toEqual("/");
    });
  });

  describe("wildcard", () => {
    it("creates wildcard route", () => {
      expect(Route.Wildcard.path).toEqual("/*");
    });
  });

  describe("param", () => {
    it("creates parameter route", () => {
      const route = Route.Param("id");

      expect(route.path).toEqual("/:id");
    });

    it("creates parameter route with descriptive name", () => {
      const route = Route.Param("userId");

      expect(route.path).toEqual("/:userId");
    });

    it("constructs Int routes and rejects malformed encoded values", () =>
      Effect.gen(function* () {
        const route = Route.Int("id");
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "42" });
        const encoded = yield* Schema.encodeEffect(route.paramsSchema)({ id: 42 });
        const malformed = yield* Effect.exit(
          Schema.decodeEffect(route.paramsSchema)({ id: "not-an-integer" }),
        );

        expect(decoded).toEqual({ id: 42 });
        expect(encoded).toEqual({ id: "42" });
        expect(Exit.isFailure(malformed)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("constructs Number routes that accept finite values and reject non-finite values", () =>
      Effect.gen(function* () {
        const route = Route.Number("value");
        const decimal = yield* Schema.decodeEffect(route.paramsSchema)({ value: "-12.5" });
        const exponent = yield* Schema.decodeEffect(route.paramsSchema)({ value: "1e3" });

        expect(decimal).toEqual({ value: -12.5 });
        expect(exponent).toEqual({ value: 1_000 });

        for (const value of ["NaN", "Infinity", "-Infinity", "1e309"]) {
          const result = yield* Effect.exit(Schema.decodeEffect(route.paramsSchema)({ value }));
          expect(Exit.isFailure(result), value).toBe(true);
        }
      }).pipe(Effect.scoped, Effect.runPromise));

    it("accepts descriptive and suffixed parameter names", () => {
      expect(Route.Param("organizationId").path).toEqual("/:organizationId");
      expect(Route.Param("id1").path).toEqual("/:id1");
    });
  });

  describe("join", () => {
    it("joins literal routes", () => {
      const route = Route.Join(Route.Parse("api"), Route.Parse("users"));

      expect(route.path).toEqual("/api/users");
    });

    it("joins literal with parameter", () => {
      const route = Route.Join(Route.Parse("users"), Route.Param("id"));

      expect(route.path).toEqual("/users/:id");
    });

    it("joins multiple routes", () => {
      const route = Route.Join(
        Route.Parse("api"),
        Route.Parse("v1"),
        Route.Parse("users"),
        Route.Param("userId"),
        Route.Parse("posts"),
        Route.Param("postId"),
      );

      expect(route.path).toEqual("/api/v1/users/:userId/posts/:postId");
    });

    it("joins with wildcard", () => {
      const route = Route.Join(Route.Parse("files"), Route.Wildcard);

      expect(route.path).toEqual("/files/*");
    });

    it("preserves schema-backed parameter decoding and encoding", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Int("id"));
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "42" });
        const encoded = yield* Schema.encodeEffect(route.paramsSchema)({ id: 42 });
        const malformed = yield* Effect.exit(
          Schema.decodeEffect(route.paramsSchema)({ id: "not-an-integer" }),
        );

        expect(decoded).toEqual({ id: 42 });
        expect(encoded).toEqual({ id: "42" });
        expect(Exit.isFailure(malformed)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("applies excess-property policy once across joined codecs", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Int("id"), Route.Param("slug"));
        const options = { onExcessProperty: "error" as const };
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)(
          { id: "42", slug: "post" },
          options,
        );
        const excess = yield* Effect.exit(
          Schema.decodeUnknownEffect(route.paramsSchema)(
            { id: "42", slug: "post", unexpected: true },
            options,
          ),
        );

        expect(decoded).toEqual({ id: 42, slug: "post" });
        expect(Exit.isFailure(excess)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("rejects duplicate decoded parameter names", () => {
      expect(() => Route.Join(Route.Param("id"), Route.Int("id"))).toThrow(TypeError);
    });

    it("rejects duplicate decoded names within one query declaration", () => {
      expect(() => Route.Parse("?a=:value&b=:value")).toThrow(TypeError);
    });

    it("joins slash with a literal segment", () => {
      expect(Route.Join(Route.Slash, Route.Parse("users")).path).toEqual("//users");
    });

    it("joins a parameter at the start", () => {
      expect(Route.Join(Route.Param("tenant"), Route.Parse("users")).path).toEqual("/:tenant/users");
    });

    it("joins a wildcard at the start", () => {
      expect(Route.Join(Route.Wildcard, Route.Parse("match")).path).toEqual("/*/match");
    });

    it("joins three consecutive parameters", () => {
      expect(
        Route.Join(Route.Param("a"), Route.Param("b"), Route.Param("c")).path,
      ).toEqual("/:a/:b/:c");
    });

    it("joins a parameter between literals", () => {
      expect(
        Route.Join(Route.Parse("users"), Route.Param("id"), Route.Parse("profile")).path,
      ).toEqual("/users/:id/profile");
    });

    it("joins a deep nested api pattern", () => {
      expect(
        Route.Join(
          Route.Parse("api"),
          Route.Parse("v2"),
          Route.Parse("organizations"),
          Route.Param("orgId"),
          Route.Parse("teams"),
          Route.Param("teamId"),
          Route.Parse("members"),
          Route.Param("memberId"),
        ).path,
      ).toEqual("/api/v2/organizations/:orgId/teams/:teamId/members/:memberId");
    });

    it("joins a wildcard at the end for catch-all routes", () => {
      expect(Route.Join(Route.Parse("docs"), Route.Param("version"), Route.Wildcard).path).toEqual(
        "/docs/:version/*",
      );
    });

    it("rejects multiple wildcards because both decode to the same field", () => {
      expect(() => Route.Join(Route.Wildcard, Route.Wildcard)).toThrow(TypeError);
    });

    it("joins alternating parameters and literals", () => {
      expect(
        Route.Join(
          Route.Param("a"),
          Route.Parse("x"),
          Route.Param("b"),
          Route.Parse("y"),
          Route.Param("c"),
        ).path,
      ).toEqual("/:a/x/:b/y/:c");
    });

    it("rejects decoded-name collisions introduced by whole-route transformations", () =>
      Effect.gen(function* () {
        const first = Route.make(
          AST.transform(
            AST.path(AST.parameter("a")),
            Schema.Struct({ value: Schema.String }),
            Transformation.transform({
              decode: (input: { readonly a: string }) => ({ value: input.a }),
              encode: (input: { readonly value: string }) => ({ a: input.value }),
            }),
          ),
        );
        const second = Route.make(
          AST.transform(
            AST.path(AST.parameter("b")),
            Schema.Struct({ value: Schema.String }),
            Transformation.transform({
              decode: (input: { readonly b: string }) => ({ value: input.b }),
              encode: (input: { readonly value: string }) => ({ b: input.value }),
            }),
          ),
        );
        const result = yield* Effect.exit(
          Schema.decodeEffect(Route.Join(first, second).paramsSchema)({ a: "A", b: "B" }),
        );

        expect(Exit.isFailure(result)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("paramsSchema", () => {
    it("decodes path params from literal route", () =>
      Effect.gen(function* () {
        const route = Route.Parse("users");
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({});

        expect(decoded).toEqual({});
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes path params from param route", () =>
      Effect.gen(function* () {
        const route = Route.Param("id");
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes path params from joined route", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes wildcard params", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("files"), Route.Wildcard);
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ "*": "path/to/file" });

        expect(decoded).toEqual({ "*": "path/to/file" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes multiple params from joined route", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("users"),
          Route.Param("userId"),
          Route.Parse("posts"),
          Route.Param("postId"),
        );
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({
          userId: "u1",
          postId: "p1",
        });

        expect(decoded).toEqual({ userId: "u1", postId: "p1" });
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("pathSchema", () => {
    it("decodes path-only params (excludes query)", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.pathSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("querySchema", () => {
    it("decodes empty query schema for path-only route", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.querySchema)({});

        expect(decoded).toEqual({});
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes dynamic query placeholders into the declared flat output", () =>
      Effect.gen(function* () {
        const route = Route.Parse("/search?q=:term&mode=all");
        const decoded = yield* Schema.decodeEffect(route.querySchema)({ term: "hello" });

        expect(decoded).toEqual({ term: "hello" });
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("pipe", () => {
    it("supports pipeable interface", () => {
      const route = Route.Parse("users");
      const result = route.pipe((r) => r.path);

      expect(result).toEqual("/users");
    });
  });
});
