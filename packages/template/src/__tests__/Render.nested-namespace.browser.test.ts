import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { assert, describe, it } from "vitest";
import {
  DomRenderTemplate,
  html,
  HtmlRenderTemplate,
  render,
  renderToHtmlString,
} from "../index.js";

const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const svgChild = (onClick: Effect.Effect<void>) =>
  html`<circle id="nested-circle" cx="5" cy="5" r="5" @click=${onClick} />`;

const svgView = (onClick: Effect.Effect<void>) =>
  html`<svg id="nested-svg">${svgChild(onClick)}</svg>`;

const mathChild = (onClick: Effect.Effect<void>) =>
  html`<mi id="nested-mi" @click=${onClick}>x</mi>`;

const mathView = (onClick: Effect.Effect<void>) =>
  html`<math id="nested-math">${mathChild(onClick)}</math>`;

const contextualLink = (context: string, onClick: Effect.Effect<void>) =>
  html`<a data-context=${context} @click=${onClick}>link</a>`;

describe("nested foreign templates", () => {
  it("constructs nested SVG in SVG and wires its event", () =>
    Effect.gen(function* () {
      let clicks = 0;
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));

      yield* render(svgView(Effect.sync(() => clicks++)), host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      const circle = host.querySelector("#nested-circle");
      assert(circle);
      assert.strictEqual(circle.namespaceURI, SVG_NAMESPACE);
      circle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      assert.strictEqual(clicks, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("constructs nested MathML in MathML and wires its event", () =>
    Effect.gen(function* () {
      let clicks = 0;
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));

      yield* render(mathView(Effect.sync(() => clicks++)), host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      const mi = host.querySelector("#nested-mi");
      assert(mi);
      assert.strictEqual(mi.namespaceURI, MATHML_NAMESPACE);
      mi.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      assert.strictEqual(clicks, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates the original nested SVG node and keeps its event live", () =>
    Effect.gen(function* () {
      let clicks = 0;
      const serverView = svgView(Effect.void);
      const ssr = yield* renderToHtmlString(serverView).pipe(Effect.provide(HtmlRenderTemplate));
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      host.innerHTML = ssr;
      const original = host.querySelector("#nested-circle");
      assert(original);

      yield* render(svgView(Effect.sync(() => clicks++)), host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      const hydrated = host.querySelector("#nested-circle");
      assert.strictEqual(hydrated, original);
      assert(hydrated);
      assert.strictEqual(hydrated.namespaceURI, SVG_NAMESPACE);
      hydrated.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      assert.strictEqual(clicks, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("caches one shared template independently for HTML and SVG insertion contexts", () =>
    Effect.gen(function* () {
      const clicks: Array<string> = [];
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      const view = html`<div>
          ${contextualLink(
            "html",
            Effect.sync(() => clicks.push("html")),
          )}
        </div>
        <svg>
          ${contextualLink(
            "svg",
            Effect.sync(() => clicks.push("svg")),
          )}
        </svg>`;

      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.drain,
      );

      const htmlLink = host.querySelector('[data-context="html"]');
      const svgLink = host.querySelector('[data-context="svg"]');
      assert(htmlLink && svgLink);
      assert.strictEqual(htmlLink.namespaceURI, "http://www.w3.org/1999/xhtml");
      assert.strictEqual(svgLink.namespaceURI, SVG_NAMESPACE);
      htmlLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      svgLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      assert.deepStrictEqual(clicks, ["html", "svg"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not build or clone a fragment after hydration succeeds", () =>
    Effect.gen(function* () {
      const renderDocument = document.implementation.createHTMLDocument();
      const view = html`<svg id="adopted-svg"><circle /></svg>`;
      const ssr = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const host = renderDocument.createElement("div");
      host.innerHTML = ssr;
      const original = host.querySelector("#adopted-svg");
      assert(original);

      let fragments = 0;
      let imports = 0;
      const createDocumentFragment = renderDocument.createDocumentFragment;
      const importNode = renderDocument.importNode;
      renderDocument.createDocumentFragment = function () {
        fragments++;
        return createDocumentFragment.call(this);
      };
      renderDocument.importNode = function <T extends Node>(node: T, deep?: boolean): T {
        imports++;
        return importNode.call(this, node, deep) as T;
      };
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          renderDocument.createDocumentFragment = createDocumentFragment;
          renderDocument.importNode = importNode;
        }),
      );

      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(renderDocument)),
        Fx.take(1),
        Fx.drain,
      );

      assert.strictEqual(host.querySelector("#adopted-svg"), original);
      assert.strictEqual(fragments, 0);
      assert.strictEqual(imports, 0);
    }).pipe(Effect.scoped, Effect.runPromise));
});
