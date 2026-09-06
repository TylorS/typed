import { assert, describe, it } from "vitest";
import type { Scope } from "effect";
import { Effect, Layer, Schema } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import type { Renderable, RenderTemplate } from "../index.js";
import { CurrentRenderQueue, EventHandler, html, render, RenderQueue } from "../index.js";
import type { Rendered } from "../Wire.js";
import { createHappyDomLayer } from "./helpers/dom-layer.js";
import { makeClassListUpdater } from "../internal/dom.js";

describe("Render", () => {
  it("renders a simple template", () =>
    renderHtmlElement`<div>Hello, world!</div>`.pipe(
      Effect.asVoid,
      Effect.scoped,
      Effect.runPromise,
    ));

  it("renders any renderable directly", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      yield* render(
        [html`<span>First</span>`, " between ", Effect.succeed(html`<span>Last</span>`)],
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.drain);

      assert.equal(window.document.body.textContent, "First between Last");
      assert.deepEqual(
        Array.from(window.document.body.querySelectorAll("span"), (element) => element.textContent),
        ["First", "Last"],
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with static attribute", () =>
    Effect.gen(function* () {
      const staticExample = yield* renderHtmlElement`<div data-foo="Hello, world!"></div>`;
      assert(staticExample.getAttribute("data-foo") === "Hello, world!");
      assert(staticExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with primitive attribute interpolation", () =>
    Effect.gen(function* () {
      const primitiveExample = yield* renderHtmlElement`<div data-foo=${"Hello, world!"}></div>`;
      assert(primitiveExample.getAttribute("data-foo") === "Hello, world!");
      assert(primitiveExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with Effect attribute", () =>
    Effect.gen(function* () {
      const effectExample =
        yield* renderHtmlElement`<div data-foo=${Effect.succeed("Hello, world!")}></div>`;
      assert(effectExample.getAttribute("data-foo") === "Hello, world!");
      assert(effectExample.dataset.foo === "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with reactive Fx attribute", () =>
    Effect.gen(function* () {
      const values = ["A", "B", "C"];
      const interval = 100;
      const fxExample = yield* renderHtmlElement`<div data-foo=${Fx.mergeAll(
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

  it("does not invoke a synchronous queue cleanup before it is initialized", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const queue = new ImmediateRenderQueue();
      const services = layer.pipe(Layer.merge(Layer.succeed(CurrentRenderQueue, queue)));
      const [example] = yield* render(
        html`<div>${Fx.succeed("ready")}</div>`,
        window.document.body,
      ).pipe(Fx.provide(services), Fx.take(1), Fx.collectAll);
      yield* Effect.yieldNow;

      const element = example.valueOf();
      assert(element instanceof window.HTMLElement);
      assert.equal(element.textContent, "ready");
      assert.equal(queue.addCalls, 1);
      assert.equal(queue.taskDefect, undefined);
      assert.equal(queue.cleanupCalls, 1);
      assert.equal(queue.cleanupDefect, undefined);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders when a dynamic Fx completes without emitting", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const [example] = yield* render(
        html`<div>before${Fx.empty}after</div>`,
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll, Effect.timeout(100));

      const element = example.valueOf();
      assert(element instanceof window.HTMLElement);
      assert.equal(element.textContent, "beforeafter");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a boolean attribute", () =>
    Effect.gen(function* () {
      const trueExample = yield* renderHtmlElement`<div ?hidden=${true}></div>`;
      assert(trueExample.hasAttribute("hidden"));

      const falseExample = yield* renderHtmlElement`<div ?hidden=${false}></div>`;
      assert(!falseExample.hasAttribute("hidden"));

      const effectTrueExample =
        yield* renderHtmlElement`<div ?hidden=${Effect.succeed(true)}></div>`;
      assert(effectTrueExample.hasAttribute("hidden"));

      const effectFalseExample =
        yield* renderHtmlElement`<div ?hidden=${Effect.succeed(false)}></div>`;
      assert(!effectFalseExample.hasAttribute("hidden"));

      const fxTrueExample = yield* renderHtmlElement`<div ?hidden=${Fx.succeed(true)}></div>`;
      assert(fxTrueExample.hasAttribute("hidden"));

      const fxFalseExample = yield* renderHtmlElement`<div ?hidden=${Fx.succeed(false)}></div>`;
      assert(!fxFalseExample.hasAttribute("hidden"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name", () =>
    Effect.gen(function* () {
      const staticExample = yield* renderHtmlElement`<div class="foo"></div>`;
      assert(staticExample.classList.contains("foo"));

      const primitiveExample = yield* renderHtmlElement`<div class=${"foo"}></div>`;
      assert(primitiveExample.classList.contains("foo"));

      const effectExample = yield* renderHtmlElement`<div class=${Effect.succeed("foo")}></div>`;
      assert(effectExample.classList.contains("foo"));

      const fxExample = yield* renderHtmlElement`<div class=${Fx.succeed("foo")}></div>`;
      assert(fxExample.classList.contains("foo"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation", () =>
    Effect.gen(function* () {
      const classNameExample = yield* renderHtmlElement`<div class=${"foo bar baz"}></div>`;
      assert(classNameExample.classList.contains("foo"));
      assert(classNameExample.classList.contains("bar"));
      assert(classNameExample.classList.contains("baz"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with a class name interpolation with holes", () =>
    Effect.gen(function* () {
      const classNameExample =
        yield* renderHtmlElement`<div class="${"foo"} ${Effect.succeed("bar")} ${Fx.succeed(
          "baz",
        )}"></div>`;
      assert(classNameExample.classList.contains("foo"));
      assert(classNameExample.classList.contains("bar"));
      assert(classNameExample.classList.contains("baz"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("updates only the class names contributed by its dynamic part", () => {
    const [window] = createHappyDomLayer();
    const element = window.document.createElement("div");
    element.classList.add("external");
    const update = makeClassListUpdater(element);

    update(["owned"]);
    assert.deepEqual(Array.from(element.classList), ["external", "owned"]);

    element.classList.add("also-external");
    update(["next"]);
    assert.deepEqual(Array.from(element.classList), ["external", "also-external", "next"]);
  });

  it("renders template with data attributes", () =>
    Effect.gen(function* () {
      const dataExample = yield* renderHtmlElement`<div .data=${{
        a: "a",
        b: Effect.succeed("b"),
        c: Fx.succeed("c"),
      }} />`;

      assert(dataExample.dataset.a === "a");
      assert(dataExample.dataset.b === "b");
      assert(dataExample.dataset.c === "c");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("reconciles records emitted by a reactive data part", () =>
    Effect.gen(function* () {
      const data = yield* RefSubject.make<Record<string, string>>({ a: "A" });
      const dataExample = yield* renderHtmlElement`<div .data=${data} />`;

      assert.deepStrictEqual({ ...dataExample.dataset }, { a: "A" });

      yield* RefSubject.set(data, { a: "changed", b: "B" });
      yield* Effect.sleep(20);
      assert.deepStrictEqual({ ...dataExample.dataset }, { a: "changed", b: "B" });

      yield* RefSubject.set(data, { b: "B" });
      yield* Effect.sleep(20);
      assert.deepStrictEqual({ ...dataExample.dataset }, { b: "B" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders a callable hydrated RefSubject through nested reactive data", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Finite, 1);
      const example = yield* renderHtmlElement`<div ref=${count} .data=${{
        count,
      }}>${count}</div>`;
      yield* Effect.sleep(20);

      assert.strictEqual(example.textContent, "1");
      assert.strictEqual(example.dataset.count, "1");

      yield* RefSubject.set(count, 2);
      yield* Effect.sleep(20);
      assert.strictEqual(example.textContent, "2");
      assert.strictEqual(example.dataset.count, "2");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments", () =>
    Effect.gen(function* () {
      const commentExample = yield* renderComment`<!--Hello, world!-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with holes", () =>
    Effect.gen(function* () {
      const commentExample = yield* renderComment`<!--${"Hello, world!"}-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders comments with multiple holes", () =>
    Effect.gen(function* () {
      const commentExample =
        yield* renderComment`<!--${"Hello"}, ${Effect.succeed("world")}${Fx.succeed("!")}-->`;
      assert.equal(commentExample.textContent, "Hello, world!");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders template with property syntax", () =>
    Effect.gen(function* () {
      const x = {};
      const propertyExample = yield* renderHtmlElement`<div .foo=${Effect.succeed(x)}></div>`;
      assert((propertyExample as any).foo === x);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports ref parts", () =>
    Effect.gen(function* () {
      let element: HTMLElement | undefined;
      const refExample = yield* renderHtmlElement`<div ref=${(el: HTMLElement) => {
        element = el;
      }}></div>`;
      assert(element === refExample);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports sparse attributes", () =>
    Effect.gen(function* () {
      const sparseExample = yield* renderHtmlElement`<div attr="${"foo"} ${"bar"} ${"baz"}"></div>`;
      assert(sparseExample.getAttribute("attr") === "foo bar baz");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements", () =>
    Effect.gen(function* () {
      const textOnlyExample =
        yield* renderHtmlElement`<script>console.log("${"Hello, world!"}")</script>`;
      assert.equal(textOnlyExample.textContent, 'console.log("Hello, world!")');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports text only elements with multipleholes", () =>
    Effect.gen(function* () {
      const textOnlyExample =
        yield* renderHtmlElement`<script>console.log("${"Hello"}, ${Effect.succeed("world")}${Fx.succeed(
          "!",
        )}")</script>`;
      assert.equal(textOnlyExample.textContent, 'console.log("Hello, world!")');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports spread attributes", () =>
    Effect.gen(function* () {
      const spreadExample = yield* renderHtmlElement`<div ...${{ foo: "bar", baz: "qux" }}></div>`;
      assert(spreadExample.getAttribute("foo") === "bar");
      assert(spreadExample.getAttribute("baz") === "qux");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("reconciles reactive spread keys and disposes removed resources", () =>
    Effect.gen(function* () {
      let clicks = 0;
      let refs = 0;
      const ref = () =>
        Effect.acquireRelease(
          Effect.sync(() => refs++),
          () => Effect.sync(() => refs--),
        );
      const props = yield* RefSubject.make<Record<string, unknown>>({
        id: "old",
        title: "old title",
        "?hidden": true,
        ".data": { phase: "old" },
        ref,
      });
      const spreadExample = yield* renderHtmlElement`<button ...${props}>button</button>`;

      assert.strictEqual(spreadExample.id, "old");
      assert.strictEqual(spreadExample.title, "old title");
      assert.strictEqual(spreadExample.hidden, true);
      assert.strictEqual(spreadExample.dataset.phase, "old");
      assert.strictEqual(refs, 1);

      yield* RefSubject.set(props, {
        title: "new title",
        "?autofocus": true,
        ".data": { phase: "new" },
        onclick: EventHandler.make(() => {
          clicks++;
        }),
      });
      yield* Effect.sleep(20);

      assert.strictEqual(spreadExample.hasAttribute("id"), false);
      assert.strictEqual(spreadExample.title, "new title");
      assert.strictEqual(spreadExample.hidden, false);
      assert.strictEqual(spreadExample.hasAttribute("autofocus"), true);
      assert.strictEqual(spreadExample.dataset.phase, "new");
      assert.strictEqual(refs, 0);
      spreadExample.dispatchEvent(
        new spreadExample.ownerDocument.defaultView!.MouseEvent("click", { bubbles: true }),
      );
      yield* Effect.yieldNow;
      assert.strictEqual(clicks, 1);

      yield* RefSubject.set(props, {});
      yield* Effect.sleep(20);

      assert.strictEqual(spreadExample.hasAttribute("title"), false);
      assert.strictEqual(spreadExample.hasAttribute("autofocus"), false);
      assert.strictEqual(spreadExample.hasAttribute("data-phase"), false);
      spreadExample.dispatchEvent(
        new spreadExample.ownerDocument.defaultView!.MouseEvent("click", { bubbles: true }),
      );
      yield* Effect.yieldNow;
      assert.strictEqual(clicks, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not allow a spread record to select DOM property writes", () =>
    Effect.gen(function* () {
      const originalInnerHtml = "<span>safe</span>";
      const spreadExample = yield* renderHtmlElement`<div ...${{
        ".constructor": "replaced",
        ".innerHTML": "<script>unsafe</script>",
      }}>${html`<span>safe</span>`}</div>`;

      assert.strictEqual(typeof spreadExample.constructor, "function");
      assert.strictEqual(spreadExample.querySelector("script"), null);
      assert.strictEqual(spreadExample.innerHTML.includes(originalInnerHtml), true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("binds safe form-control properties from spread records", () =>
    Effect.gen(function* () {
      const value = yield* RefSubject.make("initial");
      const indeterminate = yield* RefSubject.make(true);
      const invalid = yield* RefSubject.make<boolean | undefined>(true);
      const rendered = yield* renderHtmlElement`<input
        type="checkbox"
        ...${{ ".value": value, ".indeterminate": indeterminate, "aria-invalid": invalid }}
      />`;
      const input = rendered as HTMLInputElement;

      assert.strictEqual(input.value, "initial");
      assert.strictEqual(input.indeterminate, true);
      assert.strictEqual(input.getAttribute("aria-invalid"), "true");

      yield* RefSubject.set(value, "updated");
      yield* RefSubject.set(indeterminate, false);
      yield* RefSubject.set(invalid, undefined);
      yield* Effect.sleep(20);

      assert.strictEqual(input.value, "updated");
      assert.strictEqual(input.indeterminate, false);
      assert.strictEqual(input.hasAttribute("aria-invalid"), false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports effects as event handlers using @event syntax", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* renderHtmlElement`<div @click=${Effect.sync(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports EventHandlers using @event syntax", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* renderHtmlElement`<div @click=${EventHandler.make(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports effects as event handlers using onclick attribute", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* renderHtmlElement`<div onclick=${Effect.sync(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports EventHandlers using onclick attribute", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* renderHtmlElement`<div onclick=${EventHandler.make(() => {
        clicked = true;
      })}></div>`;
      eventExample.click();
      assert(clicked);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("event handler allows camelCase event names", () =>
    Effect.gen(function* () {
      let clicked = false;
      const eventExample = yield* renderHtmlElement`<div onClick=${EventHandler.make(
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
      const numberExample = yield* renderHtmlElement`<div>${1}</div>`;
      assert.equal(numberExample.textContent, "1");
      const stringExample = yield* renderHtmlElement`<div>${"Hello, world!"}</div>`;
      assert.equal(stringExample.textContent, "Hello, world!");
      const booleanExample = yield* renderHtmlElement`<div>${true}</div>`;
      assert.equal(booleanExample.textContent, "true");
      const bigintExample = yield* renderHtmlElement`<div>${BigInt(1)}</div>`;
      assert.equal(bigintExample.textContent, "1");
      const symbolExample = yield* renderHtmlElement`<div>${Symbol("foo")}</div>`;
      assert.equal(symbolExample.textContent, "Symbol(foo)");
      const undefinedExample = yield* renderHtmlElement`<div>${undefined}</div>`;
      assert.equal(undefinedExample.textContent, "");
      const nullExample = yield* renderHtmlElement`<div>${null}</div>`;
      assert.equal(nullExample.textContent, "");
      const arrayExample = yield* renderHtmlElement`<div>${[1, "Hello", true]}</div>`;
      assert.equal(arrayExample.textContent, "1Hellotrue");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates dom render events", () =>
    Effect.gen(function* () {
      const renderEventExample = yield* renderHtmlElement`<div>${html`
        <p>Hello, world!</p>
      `}</div>`;
      assert.equal(renderEventExample.innerHTML, `<p>Hello, world!</p>${TYPED_NODE_END(0)}`);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("interpolates array of render events", () =>
    Effect.gen(function* () {
      const renderEventExample = yield* renderHtmlElement`<div>${[
        html` <p>A</p> `,
        html` <p>B</p> `,
      ]}</div>`;
      assert.equal(renderEventExample.innerHTML, `<p>A</p><p>B</p>${TYPED_NODE_END(0)}`);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function renderHtmlElement<Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return renderTemplate(template, values, (example, window): asserts example is HTMLElement =>
    assert(example instanceof window.HTMLElement),
  );
}

function renderComment<Values extends ReadonlyArray<Renderable.Any>>(
  template: TemplateStringsArray,
  ...values: Values
) {
  return renderTemplate(template, values, (example, window): asserts example is Comment =>
    assert(example instanceof window.Comment),
  );
}

function renderTemplate<Values extends ReadonlyArray<Renderable.Any>, T extends Rendered>(
  template: TemplateStringsArray,
  values: Values,
  assertion: (
    example: Rendered,
    window: globalThis.Window & typeof globalThis,
  ) => asserts example is T,
): Effect.Effect<
  T,
  Renderable.Error<Values[number]>,
  Scope.Scope | Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return Effect.gen(function* () {
    const [window, layer] = createHappyDomLayer();
    const [example] = yield* render(html(template, ...values), window.document.body).pipe(
      Fx.provide(layer),
      Fx.take(1),
      Fx.collectAll,
    );

    assertion(example, window);

    return example;
  });
}

const TYPED_NODE_END = (i: number) => `<!--/n_${i}-->`;

class ImmediateRenderQueue extends RenderQueue {
  addCalls = 0;
  cleanupCalls = 0;
  taskDefect: unknown;
  cleanupDefect: unknown;

  override readonly add = (
    _key: unknown,
    task: () => void,
    cleanup: () => void,
    _priority: number,
  ): Disposable => {
    this.addCalls += 1;
    try {
      task();
    } catch (defect) {
      this.taskDefect = defect;
    }
    try {
      this.cleanupCalls += 1;
      cleanup();
    } catch (defect) {
      this.cleanupDefect = defect;
    }
    return { [Symbol.dispose]: () => {} };
  };

  protected schedule(): Disposable {
    return { [Symbol.dispose]: () => {} };
  }
}
