import { HttpRouter, HttpMiddleware, HttpServer } from "@effect/platform";
import * as NodeContext from "@effect/platform-node/NodeContext";
import { NodeRuntime, NodeHttpServer } from "@effect/platform-node";
import { html, staticLayer } from "@typed/template";
import { htmlResponse } from "@typed/template/Platform";
import { Effect, Layer } from "effect";
import { createServer } from "node:http";

const template = html`<!doctype html>
  <html>
    <head>
      <title>Typed SSR</title>
    </head>
    <body>
      <h1>Hello, world!</h1>
    </body>
  </html>`;

const server = HttpRouter.empty.pipe(
  HttpRouter.get("/", htmlResponse(template)),
  HttpServer.serve(HttpMiddleware.logger)
);

const HttpLive = server.pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: 3000 })),
  Layer.provide(NodeContext.layer),
  Layer.provide(staticLayer)
);

HttpLive.pipe(
  Layer.launch,
  Effect.tapErrorCause(Effect.logError),
  NodeRuntime.runMain
);
