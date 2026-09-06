import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import {
  DomRenderTemplate,
  html,
  HtmlRenderTemplate,
  many,
  render,
  renderToHtmlString,
} from "../index.js";

const payload =
  '<img id="ordinary-xss" src="/__typed_ts01_missing__.png" onerror="globalThis.__typedTs01Executed = true">';

describe("TS-01 hydration in Chromium", () => {
  it("keeps an ordinary malicious child as the same literal text before and after hydration", () =>
    Effect.gen(function* () {
      const view = html`<main id="ts01-value">${payload}</main>`;
      const ssr = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      (globalThis as Record<string, unknown>).__typedTs01Executed = false;

      host.innerHTML = ssr;
      yield* Effect.promise(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );

      const original = host.querySelector<HTMLElement>("#ts01-value");
      assert(original);
      assert.strictEqual(host.querySelector("#ordinary-xss"), null);
      assert.strictEqual(host.querySelector("script"), null);
      assert.strictEqual((globalThis as Record<string, unknown>).__typedTs01Executed, false);
      assert.strictEqual(original.textContent, payload);

      const [hydrated] = yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.collectUpTo(1),
      );

      assert.strictEqual(hydrated, original);
      assert.strictEqual(original.textContent, payload);
      assert.strictEqual(host.querySelector("#ordinary-xss"), null);
      assert.strictEqual((globalThis as Record<string, unknown>).__typedTs01Executed, false);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("SSR parsing security in Chromium (not hydration identity parity)", () => {
  it.each([
    ["textarea", "TeXtArEa"],
    ["title", "TiTlE"],
    ["script", "ScRiPt"],
    ["style", "StYlE"],
    ["xmp", "XmP"],
  ] as const)("does not parse a dynamic </%s sequence as markup", (tagName, closingName) =>
    Effect.gen(function* () {
      const payload = `</${closingName}><img id="${tagName}-xss" src=x onerror="globalThis.__typedTextOnlyExecuted = true">`;
      const view = html(
        [`<${tagName} id="${tagName}-host">`, `</${tagName}>`] as unknown as TemplateStringsArray,
        payload,
      );
      const ssr = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      (globalThis as Record<string, unknown>).__typedTextOnlyExecuted = false;

      host.innerHTML = ssr;
      yield* Effect.promise(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );

      assert.strictEqual(host.querySelector(`#${tagName}-xss`), null);
      assert.strictEqual((globalThis as Record<string, unknown>).__typedTextOnlyExecuted, false);
    }).pipe(Effect.scoped, Effect.runPromise),
  );

  it("hydrates a keyed item whose application key contains a comment terminator", () =>
    Effect.gen(function* () {
      const key =
        '--><img id="many-xss" src=x onerror="globalThis.__typedManyExecuted = true"><!--';
      const view = html`<ul id="many-host">
        ${many(
          Fx.succeed([{ key }]),
          (item) => item.key,
          () => html`<li id="many-item">item</li>`,
        )}
      </ul>`;
      const ssr = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      (globalThis as Record<string, unknown>).__typedManyExecuted = false;

      host.innerHTML = ssr;
      const original = host.querySelector("#many-host");
      assert(original);
      assert.strictEqual(host.querySelector("#many-xss"), null);

      const [hydrated] = yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.collectUpTo(1),
      );

      assert.strictEqual(hydrated, original);
      assert.strictEqual(host.querySelector("#many-item")?.textContent, "item");
      assert.strictEqual(host.querySelector("#many-xss"), null);
      assert.strictEqual((globalThis as Record<string, unknown>).__typedManyExecuted, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates distinct globally registered symbols", () =>
    Effect.gen(function* () {
      const keys = ["a", "b", "c", "d"].map(Symbol.for);
      const values = keys.map((key, index) => ({ index, key }));
      const view = html`<ul id="local-symbol-host">
        ${many(
          Fx.succeed(values),
          (item) => item.key,
          (_item, key) => html`<li data-key=${keys.indexOf(key)}>item</li>`,
        )}
      </ul>`;
      const ssr = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const markers = [...ssr.matchAll(/<!--\/m_v1_g\.([^>]+)-->/g)].map((match) => match[1]);
      assert.strictEqual(markers.length, 4);
      assert.strictEqual(new Set(markers).size, 4);

      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      host.innerHTML = ssr;
      const original = host.querySelector("#local-symbol-host");
      assert(original);

      const [hydrated] = yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.collectUpTo(1),
      );

      assert.strictEqual(hydrated, original);
      assert.deepStrictEqual(
        Array.from(host.querySelectorAll("li"), (element) => element.getAttribute("data-key")),
        ["0", "1", "2", "3"],
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not turn spread keys into browser event attributes", () =>
    Effect.gen(function* () {
      const props = Object.fromEntries([
        ["id", "spread-host"],
        ["onclick", "globalThis.__typedSpreadExecuted = true"],
        ['x" onpointerenter="globalThis.__typedSpreadExecuted = true', "value"],
      ]);
      const ssr = yield* renderToHtmlString(html`<button ...${props}>safe</button>`).pipe(
        Effect.provide(HtmlRenderTemplate),
      );
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      (globalThis as Record<string, unknown>).__typedSpreadExecuted = false;

      host.innerHTML = ssr;
      const button = host.querySelector<HTMLButtonElement>("#spread-host");
      assert(button);
      button.click();
      button.dispatchEvent(new PointerEvent("pointerenter"));

      assert.strictEqual(button.getAttribute("onclick"), null);
      assert.strictEqual(button.getAttribute("onpointerenter"), null);
      assert.strictEqual((globalThis as Record<string, unknown>).__typedSpreadExecuted, false);
    }).pipe(Effect.scoped, Effect.runPromise));
});
