import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "../CurrentRoute.js";
import { ServerRouter } from "../Router.js";
import { TestRouter } from "../RouterTest.js";
import * as Route from "../Route.js";

describe("typed/router/CurrentRoute", () => {
  it("keeps ServerRouter's mount context stable while navigation changes", () =>
    Effect.gen(function* () {
      const before = yield* CurrentRoute;
      yield* Navigation.navigate("/other");
      const after = yield* CurrentRoute;
      const currentEntry = yield* Navigation.currentEntry;

      expect(before.route.path).toEqual("/");
      expect(after).toBe(before);
      expect(currentEntry.url.pathname).toEqual("/other");
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/tasks" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("extend shadows the ambient route while preserving the parent tree", () =>
    Effect.gen(function* () {
      const parent = yield* CurrentRoute;
      const nested = Route.Parse("nested");
      const current = yield* Effect.provide(CurrentRoute.extend(nested))(CurrentRoute);

      expect(current.route.path).toEqual("/nested");
      expect(current.parent?.route.path).toEqual("/");
      expect(current.parent).toBe(parent);
    }).pipe(
      Effect.provide(ServerRouter({ url: "http://localhost/" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("TestRouter constructs navigation compatible with CurrentRoute", () =>
    Effect.gen(function* () {
      const route = yield* CurrentRoute;
      const entry = yield* Navigation.currentEntry;

      expect(route.route.path).toEqual("/");
      expect(entry.url.pathname).toEqual("/app/dashboard");
    }).pipe(
      Effect.provide(TestRouter({ url: "http://localhost/app/dashboard" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
