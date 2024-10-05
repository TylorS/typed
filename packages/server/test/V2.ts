import { NodeHttpServer } from "@effect/platform-node";
import { Schema } from "@effect/schema";
import { describe, it } from "@effect/vitest";
import { Route, Router } from "@typed/core";
import { Effect, flow, Layer, ManagedRuntime } from "effect";
// @ts-ignore no types
import getPort from "get-port";
import { createServer } from "http";
import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "../src";
import { HttpApiBuilderRouter } from "../src/HttpApiBuilder";

describe("V2", () => {
  it.effect("should work", () =>
    Effect.gen(function* () {
      const fooRoute = Route.literal("foo").concat(Route.integer("fooId"));
      const fooEndpoint = HttpApiEndpoint.get(
        `foo`,
        fooRoute.pipe(Router.map(({ fooId }) => fooId))
      ).pipe(HttpApiEndpoint.setSuccess(Schema.String));
      const fooHandler = fooEndpoint.pipe(
        HttpApiEndpoint.handle(({ path }) => Effect.succeed(`Got foo ${path}`))
      );

      const barRoute = Route.literal("bar").concat(Route.BigInt("barId"));
      const barEndpoint = HttpApiEndpoint.get(`bar`, barRoute).pipe(
        HttpApiEndpoint.setSuccess(Schema.String)
      );
      const barHandler = barEndpoint.pipe(
        HttpApiEndpoint.handle(({ path }) =>
          Effect.succeed(`Got bar ${path.barId}`)
        )
      );

      class FooBar extends HttpApiGroup.make(`FooBar`).pipe(
        HttpApiGroup.add(fooEndpoint),
        HttpApiGroup.add(barEndpoint)
      ) {}

      const Api = HttpApi.empty.pipe(HttpApi.addGroup(FooBar));

      const FooBarLive = HttpApiBuilder.group(
        Api,
        `FooBar`,
        flow(fooHandler, barHandler)
      );
      const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(FooBarLive));

      const port = yield* Effect.promise(() => getPort()); // Get an available port

      const ServerLive = ApiLive.pipe(
        Layer.provide(
          NodeHttpServer.layer(createServer, { port: port as number })
        ), // Use the available port
        Layer.provideMerge(HttpApiBuilderRouter.Live),
        Layer.provideMerge(Router.layer(Route.end))
      );

      const runtime = ManagedRuntime.make(ServerLive);
      const handler = HttpApiBuilder.toWebHandler(runtime);

      yield* Effect.addFinalizer(() => runtime.disposeEffect);

      const fooResponse = yield* Effect.promise(
        () =>
          handler(new Request(`http://localhost:${port}/foo/123`)).then((r) =>
            r.json()
          ) // Use the dynamic port
      );

      expect(fooResponse).toEqual("Got foo 123");

      const barResponse = yield* Effect.promise(
        () =>
          handler(new Request(`http://localhost:${port}/bar/123`)).then((r) =>
            r.json()
          ) // Use the dynamic port
      );

      expect(barResponse).toEqual("Got bar 123");

      const fooResponse2 = yield* Effect.promise(() =>
        handler(new Request(`http://localhost:${port}/foo/asdf`))
      ); // Use the dynamic port
      expect(fooResponse2.status).toEqual(500);
    }).pipe(Effect.scoped)
  );
});
