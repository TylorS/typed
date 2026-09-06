import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { HtmlRenderTemplate } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import * as Http from "node:http";
import { parseArgs } from "node:util";
import type { ViteDevServer } from "vite";
import { routes } from "./app.js";
import { makeHost } from "./host.js";

export interface ServerOptions {
  readonly port: number;
  readonly vite?: ViteDevServer;
}

const HttpRoutes = HttpRouter.use(ssrForHttp(routes)).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(HtmlRenderTemplate),
);

export const runServer = (options: ServerOptions) =>
  makeHost(HttpRoutes, options.vite).pipe(
    Layer.provide(NodeHttpServer.layer(Http.createServer, options)),
    Layer.launch,
    NodeRuntime.runMain,
  );

if (import.meta.env.PROD) {
  const { values } = parseArgs({ options: { port: { type: "string" } } });
  runServer({ port: values.port === undefined ? 3000 : Number(values.port) });
}
