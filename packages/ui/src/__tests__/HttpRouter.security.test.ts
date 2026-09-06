import { NodeHttpServer } from "@effect/platform-node";
import { assert, describe, it } from "vitest";
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { IdsTest } from "@typed/id/IdsTest";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import { HtmlRenderTemplate, html, StaticHtmlRenderTemplate } from "@typed/template";
import { HttpClient, HttpRouter as EffectHttpRouter } from "effect/unstable/http";
import { ssrForHttp } from "../HttpRouter.js";

const payload = '<img id="ordinary-xss" src="x" onerror="globalThis.__typedTs01Executed = true">';
const escaped =
  "&lt;img id=&quot;ordinary-xss&quot; src=&quot;x&quot; onerror=&quot;globalThis.__typedTs01Executed = true&quot;&gt;";

function ssrLiveWithRenderer(renderer: typeof StaticHtmlRenderTemplate | typeof HtmlRenderTemplate) {
  const route = Route.Join(Route.Parse("echo"), Route.Param("value"));
  const matcher = Matcher.empty.match(
    route,
    (params) => html`<main id="echo">${params.pipe(Fx.map(({ value }) => value))}</main>`,
  );
  return EffectHttpRouter.use(ssrForHttp(matcher)).pipe(
    Layer.provide(renderer),
    EffectHttpRouter.serve,
    Layer.provideMerge([IdsTest(), NodeHttpServer.layerTest]),
  );
}

describe("TS-01 @typed/ui HTTP boundary", () => {
  for (const [name, renderer] of [
    ["static", StaticHtmlRenderTemplate],
    ["interactive", HtmlRenderTemplate],
  ] as const) {
    it(`serves a decoded route value as text in ${name} SSR`, () => {
      const Live = ssrLiveWithRenderer(renderer);

      return Effect.gen(function* () {
        const response = yield* HttpClient.get(`/echo/${encodeURIComponent(payload)}`);
        const body = yield* response.text;

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.headers["content-type"], "text/html; charset=utf-8");
        assert.ok(body.includes(escaped));
        assert.ok(!body.includes('<img id="ordinary-xss"'));
      }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
    });
  }
});
