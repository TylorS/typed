import { Fx, RefSubject } from "@typed/fx";
import * as Router from "@typed/router";
import { html } from "@typed/template";
import { Effect, Schema } from "effect";
import clientUrl from "./client.js?url";

const clientScriptUrl = import.meta.env.DEV ? clientUrl : "/client.js";

export const appRoutes = Router.match(
  Router.Slash,
  Fx.gen(function* () {
    const count = yield* RefSubject.hydrate(
      Schema.Number,
      Effect.sync(() => (typeof document === "undefined" ? 42 : 0)),
    );

    return html`<main>
        <h1>Full-stack counter</h1>
        <button type="button" onclick=${RefSubject.increment(count)}>Increment</button>
        <output ref=${count}>${count}</output>
        <button type="button" onclick=${RefSubject.decrement(count)}>Decrement</button>
      </main>
      <script type="module" src=${clientScriptUrl}></script>`;
  }),
);

export const routes = appRoutes.layout(
  ({ content }) => html`<html>
    <head>
      <title>Full-stack counter</title>
    </head>
    <body>
      <div id="app" style="display: contents">${content}</div>
    </body>
  </html>`,
);
