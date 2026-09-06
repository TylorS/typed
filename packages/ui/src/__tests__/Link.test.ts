import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import * as Layer from "effect/Layer";
import { Fx } from "@typed/fx";
import { CurrentPath, Navigation } from "@typed/navigation";
import { ServerRouter } from "@typed/router/Router";
import {
  DomRenderTemplate,
  EventHandler,
  html,
  render,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import { Link } from "../Link.js";
import { Window } from "happy-dom";

describe("typed/ui/Link", () => {
  it("renders <a> with href and content", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();

      const [root] = yield* render(
        Link({ href: "/about", content: "Go to about" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");
      assert(anchor.getAttribute("href") === "/about");
      assert(anchor.textContent === "Go to about");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports modern props and host overrides through Dom.renderHost", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const [root] = yield* render(
        Link(
          {
            href: "/hosted",
            content: "Hosted link",
            class: "legacy",
            props: { class: "modern" },
          },
          (props, content) =>
            html`<a ...${props} data-hosted="true">${content}</a>` as Fx.Fx<
              RenderEvent,
              never,
              RenderTemplate
            >,
        ),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;

      assert.strictEqual(anchor.className, "modern");
      assert.strictEqual(anchor.dataset.hosted, "true");
      assert.strictEqual(anchor.textContent, "Hosted link");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("intercepts same-origin click and navigates", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/about", content: "Go" }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const anchor = root as HTMLAnchorElement;
      assert(anchor.tagName === "A");

      const pathBefore = yield* CurrentPath;
      anchor.click();
      yield* Effect.sleep(50);
      const pathAfter = yield* CurrentPath;

      assert(pathBefore === "/" || pathBefore === "");
      assert(pathAfter === "/about");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("runs a benign custom click handler and then navigates", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    let clicks = 0;
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: "/with-handler",
          content: "Go",
          onclick: Effect.sync(() => clicks++),
        }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });

      anchor.dispatchEvent(event);
      yield* Effect.sleep(50);

      assert.strictEqual(clicks, 1);
      assert.strictEqual(yield* CurrentPath, "/with-handler");
      assert.strictEqual(event.defaultPrevented, true);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("lets a custom click handler veto navigation", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: "/cancelled",
          content: "Stay",
          onclick: EventHandler.make(() => undefined, { preventDefault: true }),
        }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });

      anchor.dispatchEvent(event);
      yield* Effect.sleep(25);

      assert.strictEqual(yield* CurrentPath, "/");
      assert.strictEqual(event.defaultPrevented, true);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("honors an upstream cancellation", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/captured", content: "Stay" }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
      window.document.body.addEventListener("click", (captured) => captured.preventDefault(), {
        capture: true,
        once: true,
      });

      anchor.dispatchEvent(event);
      yield* Effect.sleep(25);

      assert.strictEqual(yield* CurrentPath, "/");
      assert.strictEqual(event.defaultPrevented, true);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("preserves custom listener options", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    let clicks = 0;
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: "/once",
          target: "_blank",
          content: "Once",
          onclick: EventHandler.once(
            EventHandler.make(() => {
              clicks++;
            }),
          ),
        }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;

      anchor.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      anchor.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(25);

      assert.strictEqual(clicks, 1);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("uses history replace when replace is true", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/page-a" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/page-b", content: "Replace", replace: true }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      const beforeKey = (yield* Navigation.currentEntry).key;

      anchor.click();
      yield* Effect.sleep(50);

      assert.strictEqual(yield* CurrentPath, "/page-b");
      assert.strictEqual((yield* Navigation.entries).length, 1);
      assert.strictEqual((yield* Navigation.currentEntry).key, beforeKey);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("uses history push when replace is false", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/page-a" });
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/page-b", content: "Push", replace: false }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;

      anchor.click();
      yield* Effect.sleep(50);

      assert.strictEqual(yield* CurrentPath, "/page-b");
      assert.strictEqual((yield* Navigation.entries).length, 2);
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("leaves native-intent activations to the browser", () => {
    const [window, layer] = createHappyDomLayer({ url: "http://localhost/" });
    return Effect.gen(function* () {
      const cases = [
        ["meta", { href: "/native-meta" }, { metaKey: true }],
        ["alt", { href: "/native-alt" }, { altKey: true }],
        ["control", { href: "/native-control" }, { ctrlKey: true }],
        ["shift", { href: "/native-shift" }, { shiftKey: true }],
        ["middle button", { href: "/native-middle" }, { button: 1 }],
        ["target blank external", { href: "https://example.com", target: "_blank" }, {}],
        ["target blank same-origin", { href: "/other", target: "_blank" }, {}],
        ["external self", { href: "https://example.com", target: "_self" }, {}],
        ["download", { href: "/report.csv", download: "report.csv" }, {}],
      ] as const;

      for (const [label, options, eventInit] of cases) {
        const [root] = yield* render(
          Link({ ...options, content: label }),
          window.document.body,
        ).pipe(Fx.take(1), Fx.collectAll);
        const anchor = root as HTMLAnchorElement;
        const before = yield* CurrentPath;
        const event = new window.MouseEvent("click", {
          ...eventInit,
          bubbles: true,
          cancelable: true,
        });

        anchor.dispatchEvent(event);
        yield* Effect.sleep(10);

        assert.strictEqual(yield* CurrentPath, before, label);
        assert.strictEqual(event.defaultPrevented, false, label);
      }
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("keeps an ordinary href available without a router or JavaScript", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/download/report.csv", content: "Download report" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const anchor = root as HTMLAnchorElement;
      assert.strictEqual(anchor.tagName, "A");
      assert.strictEqual(anchor.getAttribute("href"), "/download/report.csv");
      assert.strictEqual(anchor.textContent, "Download report");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("neutralizes executable URL schemes and prevents their activation", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      for (const href of [
        "javascript:globalThis.compromised = true",
        " JaVaScRiPt:globalThis.compromised = true",
        "\njava\tscript:globalThis.compromised = true",
        "data:text/html,<script>globalThis.compromised = true</script>",
        "vbscript:msgbox(1)",
        "blob:https://example.com/attacker-controlled",
      ]) {
        const [root] = yield* render(Link({ href, content: "Unsafe" }), window.document.body).pipe(
          Fx.take(1),
          Fx.collectAll,
        );
        const anchor = root as HTMLAnchorElement;
        const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });

        assert.strictEqual(anchor.getAttribute("href"), "about:blank", href);
        anchor.dispatchEvent(event);
        yield* Effect.sleep(10);
        assert.strictEqual(event.defaultPrevented, true, href);
      }
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("neutralizes executable URLs in dynamic href values", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({
          href: Effect.succeed("javascript:globalThis.compromised = true"),
          content: "Dynamic",
        }),
        window.document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      assert.strictEqual((root as HTMLAnchorElement).getAttribute("href"), "about:blank");
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("does not serialize an executable href during SSR", () => {
    const layer = StaticHtmlRenderTemplate.pipe(
      Layer.merge(ServerRouter({ url: "https://app.example/" })),
    );
    return renderToHtmlString(
      Link({
        href: "javascript:globalThis.compromised = true",
        content: "Unsafe",
      }),
    ).pipe(
      Effect.provide(layer),
      Effect.scoped,
      Effect.map((markup) => {
        assert.ok(!markup.includes("javascript:"));
        assert.ok(markup.includes('href="about:blank"'));
      }),
      Effect.runPromise,
    );
  });

  it("preserves safe relative, HTTP(S), mail, and telephone URLs", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      for (const href of [
        "/relative?q=1#section",
        "https://example.com/path",
        "http://example.com/path",
        "mailto:team@example.com",
        "tel:+15551234567",
      ]) {
        const [root] = yield* render(Link({ href, content: "Safe" }), window.document.body).pipe(
          Fx.take(1),
          Fx.collectAll,
        );
        assert.strictEqual((root as HTMLAnchorElement).getAttribute("href"), href);
      }
    }).pipe(Effect.provide(layer), Effect.scoped, Effect.runPromise);
  });

  it("keeps keyboard activation as an anchor affordance", () => {
    const [window, layer] = createHappyDomLayer();
    return Effect.gen(function* () {
      const [root] = yield* render(
        Link({ href: "/keyboard", content: "Keyboard destination" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const anchor = root as HTMLAnchorElement;
      anchor.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      assert.strictEqual(anchor.getAttribute("href"), "/keyboard");
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const domLayer = DomRenderTemplate.using(window.document);
  const opts = params[0] as { url?: string } | undefined;
  const url = opts?.url ?? "http://localhost/";
  const routerLayer = ServerRouter({ url });
  const layer = domLayer.pipe(Layer.merge(routerLayer));
  return [window, layer] as const;
}
