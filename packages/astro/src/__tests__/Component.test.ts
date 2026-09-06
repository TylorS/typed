/* oxlint-disable require-yield -- Astro components accept stateless generator bodies. */
// @effect-diagnostics missingEffectContext:off
import { expect, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { renderToHtmlString, HtmlRenderTemplate } from "@typed/template/Html";
import type { RenderEvent } from "@typed/template/RenderEvent";
import { component, isComponent, type Services } from "../Component.js";
import server from "../server.js";

it("retains generator and returned Renderable errors and services", () => {
  class App extends Context.Service<App, { readonly title: string }>()("App") {}
  const View = component(function* (name: string) {
    const app = yield* App;
    yield* Effect.fail("yielded" as const);
    return Effect.fail("returned" as const).pipe(Effect.as(app.title + name));
  });
  expectTypeOf(View).toEqualTypeOf<
    (name: string) => Fx.Fx<RenderEvent, "yielded" | "returned", App | Services>
  >();
  const provided = component(
    function* () {
      return (yield* App).title;
    },
    Fx.provideService(App, { title: "Provided" }),
  );
  expectTypeOf(provided).toExtend<Fx.Fx<RenderEvent, never, Services>>();
  expectTypeOf(provided()).toEqualTypeOf<Fx.Fx<RenderEvent, never, Services>>();
});

it("creates a lazy branded zero-argument Fx and lifts nested renderables per run", async () => {
  let runs = 0;
  const View = component(function* () {
    runs++;
    return [Effect.succeed("hello"), 42] as const;
  });
  expect(isComponent(View)).toBe(true);
  expect(typeof View).toBe("function");
  expect(Fx.isFx(View)).toBe(true);
  expect(Fx.isFx(View())).toBe(true);
  expect(View.pipe((value) => value)).toBe(View);
  expect(View.pipe(Fx.map((value) => value))).toBeDefined();
  expect(runs).toBe(0);
  const first = await server.renderToStaticMarkup(View, {});
  expect(first.html.replace(/<!--.*?-->/g, "")).toBe("hello42");
  expect(await server.renderToStaticMarkup(View, {})).toEqual(first);
  expect(runs).toBe(2);
});

it("forwards all arguments through ordered pipelines", async () => {
  const argumentsSeen: unknown[] = [];
  const View = component(
    function* (name: string, count: number) {
      return name.repeat(count);
    },
    (fx, name, count) => {
      argumentsSeen.push([name, count]);
      return html`<p>${fx}!</p>`;
    },
    (fx, name, count) => {
      argumentsSeen.push([name, count]);
      return fx;
    },
  );
  expectTypeOf(View).toEqualTypeOf<
    (name: string, count: number) => Fx.Fx<RenderEvent, never, Services>
  >();
  expect(isComponent(View)).toBe(true);
  const rendered = await Effect.runPromise(
    renderToHtmlString(View("A", 3)).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
  );
  expect(rendered.replace(/<!--.*?-->/g, "")).toBe("<p>AAA!</p>");
  expect(argumentsSeen).toEqual([
    ["A", 3],
    ["A", 3],
  ]);
});

it("rejects a zero-argument pipeline result that cannot carry Astro's brand", () => {
  expect(() =>
    component(
      function* () {
        return "hello";
      },
      () => 42,
    ),
  ).toThrow(/pipeline/);
});

it("keeps zero-argument pipeline Fx channels callable without claiming non-Fx results", async () => {
  const View = component(
    function* () {
      return "hello";
    },
    (fx) => Fx.map(fx, (event) => event),
  );
  expectTypeOf(View()).toEqualTypeOf<Fx.Fx<RenderEvent, never, Services>>();
  expect(Fx.isFx(View)).toBe(true);
  const rendered = await Effect.runPromise(
    View.pipe(Fx.provide(HtmlRenderTemplate), Fx.collectAll, Effect.scoped),
  );
  expect(
    rendered
      .map((event) => event.toString())
      .join("")
      .replace(/<!--.*?-->/g, ""),
  ).toBe("hello");
  const configuration = component(
    function* () {
      return "unused";
    },
    () => ({ title: "metadata" }),
  );
  expectTypeOf(configuration).toEqualTypeOf<{ title: string }>();
  expect(typeof configuration).toBe("object");
  expect(Fx.isFx(configuration)).toBe(false);
});
