import { assert, describe, it, vi } from "vitest";
import type { Scope } from "effect";
import { Effect, Schema } from "effect";
import * as Deferred from "effect/Deferred";
import * as Exit from "effect/Exit";
import * as ScopeApi from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import type { Renderable, Rendered, RenderTemplate } from "../index.js";
import {
  EventHandler,
  html,
  HtmlRenderTemplate,
  many,
  render,
  renderToHtmlString,
} from "../index.js";
import { createHappyDomLayer } from "./helpers/dom-layer.js";

type NumericHydratedRef = RefSubject.HydratedRefSubject<number, Schema.SchemaError, never, never>;
type NumericHydrationRef = RefSubject.HydrationRef<Schema.SchemaError, never>;

describe("Hydration", () => {
  it("hydrates a simple template", () =>
    hydrateHtmlElement`<div>Hello, world!</div>`.pipe(
      Effect.asVoid,
      Effect.scoped,
      Effect.runPromise,
    ));

  it("hydrates template with static attribute", () =>
    Effect.gen(function* () {
      const staticExample = yield* hydrateHtmlElement`<div data-foo="Hello, world!"></div>`;
      assert(staticExample.getAttribute("data-foo") === "Hello, world!");
      assert(staticExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with primitive attribute interpolation", () =>
    Effect.gen(function* () {
      const primitiveExample = yield* hydrateHtmlElement`<div data-foo=${"Hello, world!"}></div>`;
      assert(primitiveExample.getAttribute("data-foo") === "Hello, world!");
      assert(primitiveExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with Effect attribute", () =>
    Effect.gen(function* () {
      const effectExample =
        yield* hydrateHtmlElement`<div data-foo=${Effect.succeed("Hello, world!")}></div>`;
      assert(effectExample.getAttribute("data-foo") === "Hello, world!");
      assert(effectExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with reactive Fx attribute", () =>
    Effect.gen(function* () {
      const values = ["A", "B", "C"];
      const interval = 100;
      const fxExample = yield* hydrateHtmlElement`<div data-foo=${Fx.mergeAll(
        ...values.map((value, index) => Fx.at(value, interval * index)),
      )}></div>`;
      assert(fxExample.getAttribute("data-foo") === "A");
      assert.equal(fxExample.dataset["foo"], "A");

      yield* Effect.sleep(interval * 1.5);
      assert(fxExample.getAttribute("data-foo") === "B");
      assert.equal(fxExample.dataset["foo"], "B");

      yield* Effect.sleep(interval * 1.5);
      assert(fxExample.getAttribute("data-foo") === "C");
      assert.equal(fxExample.dataset["foo"], "C");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with a boolean attribute", () =>
    Effect.gen(function* () {
      const trueExample = yield* hydrateHtmlElement`<div ?hidden=${true}></div>`;
      assert(trueExample.hasAttribute("hidden"));

      const falseExample = yield* hydrateHtmlElement`<div ?hidden=${false}></div>`;
      assert(!falseExample.hasAttribute("hidden"));

      const effectTrueExample =
        yield* hydrateHtmlElement`<div ?hidden=${Effect.succeed(true)}></div>`;
      assert(effectTrueExample.hasAttribute("hidden"));

      const effectFalseExample =
        yield* hydrateHtmlElement`<div ?hidden=${Effect.succeed(false)}></div>`;
      assert(!effectFalseExample.hasAttribute("hidden"));

      const fxTrueExample = yield* hydrateHtmlElement`<div ?hidden=${Fx.succeed(true)}></div>`;
      assert(fxTrueExample.hasAttribute("hidden"));

      const fxFalseExample = yield* hydrateHtmlElement`<div ?hidden=${Fx.succeed(false)}></div>`;
      assert(!fxFalseExample.hasAttribute("hidden"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with a class name", () =>
    Effect.gen(function* () {
      const staticExample = yield* hydrateHtmlElement`<div class="foo"></div>`;
      assert(staticExample.classList.contains("foo"));

      const primitiveExample = yield* hydrateHtmlElement`<div class=${"foo"}></div>`;
      assert(primitiveExample.classList.contains("foo"));

      const effectExample = yield* hydrateHtmlElement`<div class=${Effect.succeed("foo")}></div>`;
      assert(effectExample.classList.contains("foo"));

      const fxExample = yield* hydrateHtmlElement`<div class=${Fx.succeed("foo")}></div>`;
      assert(fxExample.classList.contains("foo"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with a class name interpolation", () =>
    Effect.gen(function* () {
      const classNameExample = yield* hydrateHtmlElement`<div class=${"foo bar baz"}></div>`;
      assert(classNameExample.classList.contains("foo"));
      assert(classNameExample.classList.contains("bar"));
      assert(classNameExample.classList.contains("baz"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with a class name interpolation with holes", () =>
    Effect.gen(function* () {
      const classNameExample =
        yield* hydrateHtmlElement`<div class="${"foo"} ${Effect.succeed("bar")} ${Fx.succeed(
          "baz",
        )}"></div>`;
      assert(classNameExample.classList.contains("foo"));
      assert(classNameExample.classList.contains("bar"));
      assert(classNameExample.classList.contains("baz"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with data attributes", () =>
    Effect.gen(function* () {
      const dataExample = yield* hydrateHtmlElement`<div .data=${{
        a: "a",
        b: Effect.succeed("b"),
        c: Fx.succeed("c"),
      }} />`;

      assert(dataExample.dataset.a === "a");
      assert(dataExample.dataset.b === "b");
      assert(dataExample.dataset.c === "c");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates comments", () =>
    Effect.gen(function* () {
      const commentExample = yield* hydrateComment`<!--Hello, world!-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates comments with holes", () =>
    Effect.gen(function* () {
      const commentExample = yield* hydrateComment`<!--${"Hello, world!"}-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates comments with multiple holes", () =>
    Effect.gen(function* () {
      const commentExample =
        yield* hydrateComment`<!--${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates template with property syntax", ({ expect }) =>
    Effect.gen(function* () {
      const x = {};
      const propertyExample = yield* hydrateHtmlElement`<div .foo=${Effect.succeed(x)}></div>`;
      expect(propertyExample.outerHTML).toMatchInlineSnapshot(`"<div foo="{}"></div>"`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports ref parts", () =>
    Effect.gen(function* () {
      let element: HTMLElement | undefined;
      const refExample = yield* hydrateHtmlElement`<div ref=${(el: HTMLElement) => {
        element = el;
      }}></div>`;
      assert(element === refExample);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("restores hydrated RefSubjects before reactive attributes start", () =>
    Effect.gen(function* () {
      const view = (count: NumericHydratedRef, ref: NumericHydrationRef = count) =>
        html`<button data-count=${count} ref=${ref}>${count}</button>`;
      const serverCount = yield* RefSubject.hydrate(Schema.Finite, 7);
      const htmlString = yield* renderToHtmlString(view(serverCount)).pipe(
        Effect.provide(HtmlRenderTemplate),
      );
      const [window, layer] = createHappyDomLayer();
      const body = window.document.body;
      body.innerHTML = htmlString;
      const original = body.querySelector("button");
      assert(original);
      const observer = new window.MutationObserver(() => {});
      observer.observe(original, {
        attributes: true,
        attributeFilter: ["data-count"],
        attributeOldValue: true,
      });

      let initialized = 0;
      const clientCount = yield* RefSubject.hydrate(
        Schema.Finite,
        Effect.sync(() => {
          initialized++;
          return 0;
        }),
      );
      let hydrationCalls = 0;
      const countedHydration: NumericHydrationRef = Object.assign(
        (element: RefSubject.HydrationElement) => {
          hydrationCalls++;
          return clientCount(element);
        },
        {
          [RefSubject.HydrationRefTypeId]: clientCount[RefSubject.HydrationRefTypeId],
        },
      );
      const [current] = yield* render(view(clientCount, countedHydration), body).pipe(
        Fx.provide(layer),
        Fx.take(1),
        Fx.collectUpTo(1),
      );
      const records = observer.takeRecords();

      assert.strictEqual(current, original);
      assert.strictEqual(hydrationCalls, 1);
      assert.strictEqual(initialized, 0);
      assert.strictEqual(yield* clientCount, 7);
      assert.strictEqual(original.getAttribute("data-count"), "7");
      assert.strictEqual(
        records.some((record) => record.oldValue === "0"),
        false,
      );
      assert.strictEqual(original.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("restores spread hydrated RefSubjects before reactive attributes start", () =>
    Effect.gen(function* () {
      const view = (
        count: NumericHydratedRef,
        ref: NumericHydrationRef = count,
        marker: string | Effect.Effect<string> = "ready",
      ) => html`<button data-count=${count} data-marker=${marker} ...${{ ref }}>${count}</button>`;
      const serverCount = yield* RefSubject.hydrate(Schema.Finite, 7);
      const htmlString = yield* renderToHtmlString(view(serverCount)).pipe(
        Effect.provide(HtmlRenderTemplate),
      );
      assert.include(htmlString, RefSubject.HYDRATION_ATTRIBUTE);

      const [window, layer] = createHappyDomLayer();
      const body = window.document.body;
      body.innerHTML = htmlString;
      const original = body.querySelector("button");
      assert(original);
      const observer = new window.MutationObserver(() => {});
      observer.observe(original, {
        attributes: true,
        attributeFilter: ["data-count"],
        attributeOldValue: true,
      });

      let initialized = 0;
      const clientCount = yield* RefSubject.hydrate(
        Schema.Finite,
        Effect.sync(() => {
          initialized++;
          return 0;
        }),
      );
      let hydrationCalls = 0;
      const setupOrder: Array<"attribute" | "ref"> = [];
      const countedHydration: NumericHydrationRef = Object.assign(
        (element: RefSubject.HydrationElement) => {
          hydrationCalls++;
          setupOrder.push("ref");
          return clientCount(element);
        },
        {
          [RefSubject.HydrationRefTypeId]: clientCount[RefSubject.HydrationRefTypeId],
        },
      );
      const [current] = yield* render(
        view(
          clientCount,
          countedHydration,
          Effect.sync(() => {
            setupOrder.push("attribute");
            return "ready";
          }),
        ),
        body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectUpTo(1));
      const records = observer.takeRecords();

      assert.strictEqual(current, original);
      assert.strictEqual(hydrationCalls, 1);
      assert.strictEqual(initialized, 0);
      assert.deepEqual(setupOrder, ["ref", "attribute"]);
      assert.strictEqual(yield* clientCount, 7);
      assert.strictEqual(original.getAttribute("data-count"), "7");
      assert.strictEqual(
        records.some((record) => record.oldValue === "0"),
        false,
      );
      assert.strictEqual(original.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates unnamed and named state from SSR with distinct lifecycles", () =>
    Effect.gen(function* () {
      const view = (
        count: NumericHydratedRef,
        page: NumericHydratedRef,
        ref: NumericHydrationRef = RefSubject.hydrateAll(count, page),
      ) => html`<section ref=${ref}></section>`;
      const serverCount = yield* RefSubject.hydrate(Schema.Finite, 1);
      const serverPage = yield* RefSubject.hydrate(Schema.FiniteFromString, 3, {
        name: "page",
      });
      const htmlString = yield* renderToHtmlString(view(serverCount, serverPage)).pipe(
        Effect.provide(HtmlRenderTemplate),
      );
      const [window, layer] = createHappyDomLayer();
      const body = window.document.body;
      body.innerHTML = htmlString;
      const original = body.querySelector("section");
      assert(original);

      const clientCount = yield* RefSubject.hydrate(Schema.Finite, 0);
      const clientPage = yield* RefSubject.hydrate(Schema.FiniteFromString, 0, {
        name: "page",
      });
      const hydration = RefSubject.hydrateAll(clientCount, clientPage);
      let hydrationCalls = 0;
      const countedHydration: NumericHydrationRef = Object.assign(
        (element: RefSubject.HydrationElement) => {
          hydrationCalls++;
          return hydration(element);
        },
        { [RefSubject.HydrationRefTypeId]: hydration[RefSubject.HydrationRefTypeId] },
      );
      const renderScope = yield* ScopeApi.make();
      const [current] = yield* render(view(clientCount, clientPage, countedHydration), body).pipe(
        Fx.provide(layer),
        Fx.take(1),
        Fx.collectUpTo(1),
        Effect.provideService(ScopeApi.Scope, renderScope),
      );
      yield* Effect.sleep(20);

      assert.strictEqual(current, original);
      assert.strictEqual(hydrationCalls, 1);
      assert.strictEqual(yield* clientCount, 1);
      assert.strictEqual(yield* clientPage, 3);
      assert.strictEqual(original.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
      assert.strictEqual(original.getAttribute("data-page"), "3");
      assert.strictEqual(yield* clientCount.subscriberCount, 0);
      assert.strictEqual(yield* clientPage.subscriberCount, 1);

      yield* RefSubject.set(clientPage, 4);
      yield* Effect.sleep(20);
      assert.strictEqual(original.getAttribute("data-page"), "4");

      yield* ScopeApi.close(renderScope, Exit.void);
      yield* Effect.sleep(20);
      assert.strictEqual(yield* clientPage.subscriberCount, 0);

      yield* RefSubject.set(clientPage, 5);
      yield* Effect.sleep(20);
      assert.strictEqual(original.getAttribute("data-page"), "4");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports sparse attributes", () =>
    Effect.gen(function* () {
      const sparseExample =
        yield* hydrateHtmlElement`<div attr="${"foo"} ${"bar"} ${"baz"}"></div>`;
      assert(sparseExample.getAttribute("attr") === "foo bar baz");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements", () =>
    Effect.gen(function* () {
      const textOnlyExample =
        yield* hydrateHtmlElement`<script>console.log("${"Hello, world!"}")</script>`;
      assert.equal(textOnlyExample.textContent, 'console.log("Hello, world!")');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements with multipleholes", () =>
    Effect.gen(function* () {
      const textOnlyExample =
        yield* hydrateHtmlElement`<script>console.log("${"Hello"}, ${Effect.succeed("world")}${Fx.succeed(
          "!",
        )}")</script>`;
      assert.equal(textOnlyExample.textContent, 'console.log("Hello, world!")');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports spread attributes", () =>
    Effect.gen(function* () {
      const spreadExample = yield* hydrateHtmlElement`<div ...${{ foo: "bar", baz: "qux" }}></div>`;
      assert(spreadExample.getAttribute("foo") === "bar");
      assert(spreadExample.getAttribute("baz") === "qux");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports effects as event handlers using @event syntax", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* hydrateHtmlElement`<div @click=${Effect.sync(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports EventHandlers using @event syntax", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* hydrateHtmlElement`<div @click=${EventHandler.make(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports effects as event handlers using onclick attribute", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* hydrateHtmlElement`<div onclick=${Effect.sync(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports EventHandlers using onclick attribute", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* hydrateHtmlElement`<div onclick=${EventHandler.make(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("event handler allows camelCase event names", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* hydrateHtmlElement`<div onClick=${EventHandler.make(
        (event) => {
          clicked = true;
          assert(event.defaultPrevented);
        },
        { preventDefault: true },
      )}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates primitive children", () =>
    Effect.gen(function* () {
      const numberExample = yield* hydrateHtmlElement`<div>${1}</div>`;
      assert.equal(numberExample.textContent, "1");
      const stringExample = yield* hydrateHtmlElement`<div>${"Hello, world!"}</div>`;
      assert.equal(stringExample.textContent, "Hello, world!");
      const booleanExample = yield* hydrateHtmlElement`<div>${true}</div>`;
      assert.equal(booleanExample.textContent, "true");
      const bigintExample = yield* hydrateHtmlElement`<div>${BigInt(1)}</div>`;
      assert.equal(bigintExample.textContent, "1");
      const symbolExample = yield* hydrateHtmlElement`<div>${Symbol("foo")}</div>`;
      assert.equal(symbolExample.textContent, "Symbol(foo)");
      const undefinedExample = yield* hydrateHtmlElement`<div>${undefined}</div>`;
      assert.equal(undefinedExample.textContent, "");
      const nullExample = yield* hydrateHtmlElement`<div>${null}</div>`;
      assert.equal(nullExample.textContent, "");
      const arrayExample = yield* hydrateHtmlElement`<div>${[1, "Hello", true]}</div>`;
      assert.equal(arrayExample.textContent, "1Hellotrue");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates dom render events", ({ expect }) =>
    Effect.gen(function* () {
      const renderEventExample = yield* hydrateHtmlElement`<div>${html`
        <p>Hello, world!</p>
      `}</div>`;
      expect(renderEventExample.innerHTML).toMatchInlineSnapshot(
        `"<!--n_0--><!--t_67ksqn+xDM4=--><p>Hello, world!</p><!--/t_67ksqn+xDM4=--><!--/n_0-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates array of render events", ({ expect }) =>
    Effect.gen(function* () {
      const renderEventExample = yield* hydrateHtmlElement`<div>${[
        html`<p>A</p>`,
        html`<p>B</p>`,
      ]}</div>`;
      expect(renderEventExample.innerHTML).toMatchInlineSnapshot(
        `"<!--n_0--><!--t_KwZ/fMOUm3w=--><p>A</p><!--/t_KwZ/fMOUm3w=--><!--t_KwZ/fASZm3w=--><p>B</p><!--/t_KwZ/fASZm3w=--><!--/n_0-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates many comments", ({ expect }) =>
    Effect.gen(function* () {
      const { current, original } = yield* hydrateHtmlElementWithOriginal`<div>${many(
        Fx.succeed([1, 2, 3]),
        (n) => n,
        (n) => html`<p>${n}</p>`,
      )}</div>`;
      assert(original === current);
      // Verify that the nodes are the same
      for (const [index, node] of Array.from(current.childNodes).entries()) {
        const originalNode = original.childNodes[index];
        expect(node).toBe(originalNode);
        expect(node.textContent).toBe(originalNode.textContent);
      }

      expect(current.innerHTML).toMatchInlineSnapshot(
        `"<!--n_0--><!--t_KwZ/fKKViAs=--><p><!--n_0-->1<!--/n_0--></p><!--/t_KwZ/fKKViAs=--><!--/m_v1_n.ADE--><!--t_KwZ/fKKViAs=--><p><!--n_0-->2<!--/n_0--></p><!--/t_KwZ/fKKViAs=--><!--/m_v1_n.ADI--><!--t_KwZ/fKKViAs=--><p><!--n_0-->3<!--/n_0--></p><!--/t_KwZ/fKKViAs=--><!--/m_v1_n.ADM--><!--/n_0-->"`,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("reorders adopted many items by key after hydration", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const items = yield* RefSubject.make([
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ]);
      const view = html`<ul>
        ${many(
          items,
          (item) => item.id,
          (item, key) => html`<li data-key=${key}>${RefSubject.map(item, (_) => _.label)}</li>`,
        )}
      </ul>`;
      const body = window.document.body;
      body.innerHTML = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const originalA = body.querySelector<HTMLElement>("[data-key=a]");
      const originalB = body.querySelector<HTMLElement>("[data-key=b]");
      assert(originalA && originalB);

      const mounted = yield* Deferred.make<void>();
      yield* render(view, body).pipe(
        Fx.provide(layer),
        Fx.observe(() => Deferred.succeed(mounted, undefined)),
        Effect.forkScoped,
      );
      yield* Deferred.await(mounted);
      yield* RefSubject.set(items, [
        { id: "b", label: "B2" },
        { id: "a", label: "A" },
      ]);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(body.querySelector("li")?.textContent, "B2")),
      );

      const current = Array.from(body.querySelectorAll<HTMLElement>("li"));
      assert.deepStrictEqual(
        current.map((element) => element.dataset["key"]),
        ["b", "a"],
      );
      assert.strictEqual(current[0], originalB);
      assert.strictEqual(current[1], originalA);
      assert.strictEqual(current[0].textContent, "B2");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("reconciles the first client many snapshot against server keys", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const serverView = html`<ul>
        ${many(
          Fx.succeed([
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
          ]),
          (item) => item.id,
          (item, key) => html`<li data-key=${key}>${RefSubject.map(item, (_) => _.label)}</li>`,
        )}
      </ul>`;
      const body = window.document.body;
      body.innerHTML = yield* renderToHtmlString(serverView).pipe(
        Effect.provide(HtmlRenderTemplate),
      );
      const originalA = body.querySelector<HTMLElement>("[data-key=a]");
      const originalB = body.querySelector<HTMLElement>("[data-key=b]");
      const originalC = body.querySelector<HTMLElement>("[data-key=c]");
      assert(originalA && originalB && originalC);

      const clientItems = yield* RefSubject.make([
        { id: "c", label: "C" },
        { id: "a", label: "A" },
      ]);
      const clientView = html`<ul>
        ${many(
          clientItems,
          (item) => item.id,
          (item, key) => html`<li data-key=${key}>${RefSubject.map(item, (_) => _.label)}</li>`,
        )}
      </ul>`;
      const mounted = yield* Deferred.make<void>();
      yield* render(clientView, body).pipe(
        Fx.provide(layer),
        Fx.observe(() => Deferred.succeed(mounted, undefined)),
        Effect.forkScoped,
      );
      yield* Deferred.await(mounted);

      const current = Array.from(body.querySelectorAll<HTMLElement>("li"));
      assert.deepStrictEqual(
        current.map((element) => element.dataset["key"]),
        ["c", "a"],
      );
      assert.strictEqual(current[0], originalC);
      assert.strictEqual(current[1], originalA);
      assert.strictEqual(originalB.isConnected, false);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function hydrateHtmlElement<Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect.Effect<
  HTMLElement,
  Renderable.Error<Values[number]>,
  Scope.Scope | Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return hydrateTemplate(
    template,
    values,
    (example, window, message): asserts example is HTMLElement => {
      assert(example instanceof window.HTMLElement, message);
    },
  ).pipe(Effect.map(({ current }) => current));
}

function hydrateComment<Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return hydrateTemplate(template, values, (example, window, message): asserts example is Comment =>
    assert(example instanceof window.Comment, message),
  ).pipe(Effect.map(({ current }) => current));
}

function hydrateTemplate<Values extends ReadonlyArray<Renderable.Any>, T extends Rendered>(
  template: TemplateStringsArray,
  values: Values,
  assertion: (
    example: Rendered,
    window: globalThis.Window & typeof globalThis,
    message?: string,
  ) => asserts example is T,
): Effect.Effect<
  { original: Rendered; current: T },
  Renderable.Error<Values[number]>,
  Scope.Scope | Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return Effect.gen(function* () {
    const [window, layer] = createHappyDomLayer();
    const fx = html(template, ...values);
    const htmlString = yield* renderToHtmlString(fx).pipe(Effect.provide(HtmlRenderTemplate));
    const body = window.document.body;
    body.innerHTML = htmlString;

    let initial = body.firstChild;
    assert(initial);
    if (initial.nodeType === initial.COMMENT_NODE) {
      initial = initial.nextSibling;
    }

    assertion(initial as Node, window);

    const [example] = yield* render(fx, body).pipe(
      Fx.provide(layer),
      Fx.take(1),
      Fx.collectUpTo(1),
    );

    assertion(example, window);

    // They should be the same node after hydration
    assert((initial as Node) === example);

    return {
      original: initial as Rendered,
      current: example,
    };
  });
}

function hydrateHtmlElementWithOriginal<Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return hydrateTemplate(
    template,
    values,
    (example, window, message): asserts example is HTMLElement => {
      assert(example instanceof window.HTMLElement, message);
    },
  );
}
