import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Option from "effect/Option";
import { Fx, RefSubject } from "@typed/fx";
import { assert, describe, expect, it, vi } from "vitest";
import { DomRenderTemplate, html, many, render } from "../index.js";

interface Item {
  readonly id: string;
  readonly label: string;
}

interface LifecycleCounts {
  connected: number;
  disconnected: number;
  moved: number;
}

const lifecycle = new Map<string, LifecycleCounts>();

class IdentityItemElement extends HTMLElement {
  connectedCallback() {
    countsFor(this.dataset["key"]!).connected += 1;
  }

  disconnectedCallback() {
    countsFor(this.dataset["key"]!).disconnected += 1;
  }

  connectedMoveCallback() {
    countsFor(this.dataset["key"]!).moved += 1;
  }
}

const IDENTITY_ITEM_TAG = "typed-g2-identity-item";

if (customElements.get(IDENTITY_ITEM_TAG) === undefined) {
  customElements.define(IDENTITY_ITEM_TAG, IdentityItemElement);
}

const initialItems = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
] as const satisfies ReadonlyArray<Item>;

const reorderedItems = [initialItems[2], initialItems[0], initialItems[1]];

const replacedItems = [
  initialItems[2],
  { id: "a", label: "A2" },
  { id: "d", label: "D" },
] as const satisfies ReadonlyArray<Item>;

describe("live DOM reconciliation identity", () => {
  it("preserves a keyed nested item and its browser-owned state across live updates", () =>
    Effect.gen(function* () {
      lifecycle.clear();
      const host = makeHost();
      const items = yield* RefSubject.make<ReadonlyArray<Item>>(initialItems);
      const eventCounts = new Map<string, number>();

      const view = html`<form data-list>
        ${many(
          items,
          (item) => item.id,
          (item, key) =>
            Fx.gen(function* () {
              const localCount = yield* RefSubject.make(0);
              const label = RefSubject.map(item, (value) => value.label);
              const increment = Effect.all(
                [
                  RefSubject.update(localCount, (count) => count + 1),
                  Effect.sync(() => eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1)),
                ],
                { discard: true },
              );

              return html`<typed-g2-identity-item data-key=${key}>
                <fieldset>
                  <label>
                    <span data-label=${key}>${label}</span>
                    <input name=${key} data-input=${key} value=${`draft-${key}`} />
                  </label>
                  <button type="button" data-increment=${key} onclick=${increment}>
                    increment
                  </button>
                  <output data-count=${key}>${localCount}</output>
                  <dialog data-dialog=${key}>dialog</dialog>
                  <div data-popover=${key} popover="manual">popover</div>
                  <iframe data-frame=${key} title=${`frame-${key}`}></iframe>
                </fieldset>
              </typed-g2-identity-item>`;
            }),
        )}
      </form>`;

      yield* mount(view, host);
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(itemOrder(host, IDENTITY_ITEM_TAG)).toEqual(["a", "b", "c"])),
      );

      const form = requiredElement<HTMLFormElement>(host, "form[data-list]");
      const original = elementsByKey<IdentityItemElement>(host, IDENTITY_ITEM_TAG);
      const c = original.get("c")!;
      const cInput = requiredElement<HTMLInputElement>(c, "[data-input=c]");
      const cButton = requiredElement<HTMLButtonElement>(c, "[data-increment=c]");
      const cDialog = requiredElement<HTMLDialogElement>(c, "[data-dialog=c]");
      const cPopover = requiredElement<HTMLElement>(c, "[data-popover=c]");
      const cFrame = requiredElement<HTMLIFrameElement>(c, "[data-frame=c]");

      cInput.select();
      cInput.setRangeText("typed-c", 0, cInput.value.length, "end");
      cInput.setSelectionRange(2, 6);
      cInput.setCustomValidity("kept-invalid");
      cDialog.show();

      const supportsPopover =
        typeof cPopover.showPopover === "function" && CSS.supports("selector(:popover-open)");
      if (supportsPopover) cPopover.showPopover();

      const frameWindow = cFrame.contentWindow;
      assert(frameWindow);
      assert(cFrame.contentDocument?.body);
      cFrame.contentDocument.body.dataset["state"] = "kept";

      const animation = c.animate([{ opacity: 1 }, { opacity: 0.5 }], {
        duration: 10_000,
        iterations: Infinity,
      });
      animation.pause();
      animation.currentTime = 4_321;
      yield* Effect.addFinalizer(() => Effect.sync(() => animation.cancel()));

      cInput.focus();
      cButton.click();
      yield* waitFor(
        () => requiredElement(c, "[data-count=c]").textContent === "1",
        "nested local count after first click",
      );

      assert.strictEqual(document.activeElement, cInput);
      assert.strictEqual(eventCounts.get("c"), 1);
      assert.strictEqual(new FormData(form).get("c"), "typed-c");
      assert(cInput.validity.customError);
      assert.strictEqual(cInput.validationMessage, "kept-invalid");

      yield* RefSubject.set(items, reorderedItems);
      yield* waitFor(
        () => itemOrder(host, IDENTITY_ITEM_TAG).join(",") === "c,a,b",
        "nested first reorder",
      );

      const reordered = elementsByKey<IdentityItemElement>(host, IDENTITY_ITEM_TAG);
      for (const key of ["a", "b", "c"] as const) {
        assert.strictEqual(reordered.get(key), original.get(key));
      }
      assert.strictEqual(requiredElement(c, "[data-input=c]"), cInput);
      assert.strictEqual(requiredElement(c, "[data-increment=c]"), cButton);
      assert.strictEqual(cInput.value, "typed-c");
      assert.strictEqual(cInput.selectionStart, 2);
      assert.strictEqual(cInput.selectionEnd, 6);
      assert(cInput.validity.customError);
      assert.strictEqual(cInput.validationMessage, "kept-invalid");
      assert.strictEqual(new FormData(form).get("c"), "typed-c");

      const supportsStatePreservingMove = typeof Element.prototype.moveBefore === "function";
      if (supportsStatePreservingMove) {
        assert.strictEqual(document.activeElement, cInput);
        assert.deepStrictEqual(countsFor("c"), { connected: 1, disconnected: 0, moved: 1 });
        assert(cDialog.open);
        if (supportsPopover) assert(cPopover.matches(":popover-open"));
        assert.strictEqual(cFrame.contentWindow, frameWindow);
        assert.strictEqual(cFrame.contentDocument?.body.dataset["state"], "kept");
        assert(c.getAnimations().includes(animation));
        assert.strictEqual(animation.currentTime, 4_321);
        assert.strictEqual(animation.playState, "paused");
      } else {
        assert.strictEqual(document.activeElement, document.body);
        assert.deepStrictEqual(countsFor("c"), { connected: 2, disconnected: 1, moved: 0 });
      }

      cButton.click();
      yield* waitFor(
        () => requiredElement(c, "[data-count=c]").textContent === "2",
        "nested local count after second click",
      );
      assert.strictEqual(eventCounts.get("c"), 2);

      yield* RefSubject.set(items, replacedItems);
      yield* Effect.promise(() =>
        vi.waitFor(() =>
          expect(itemOrder(host, IDENTITY_ITEM_TAG), "nested replacement").toEqual(["c", "a", "d"]),
        ),
      );

      const replaced = elementsByKey<IdentityItemElement>(host, IDENTITY_ITEM_TAG);
      assert.strictEqual(replaced.get("c"), original.get("c"));
      assert.strictEqual(replaced.get("a"), original.get("a"));
      assert.strictEqual(replaced.get("b"), undefined);
      assert.notStrictEqual(replaced.get("d"), original.get("b"));
      assert.strictEqual(original.get("b")?.isConnected, false);
      assert.strictEqual(requiredElement(host, "[data-label=a]").textContent, "A2");
      assert.strictEqual(requiredElement(c, "[data-count=c]").textContent, "2");
      assert.strictEqual(cInput.value, "typed-c");
      assert.strictEqual(new FormData(form).get("c"), "typed-c");
      assert.strictEqual(countsFor("b").disconnected, 1);
      assert.strictEqual(countsFor("d").connected, 1);

      yield* RefSubject.set(items, []);
      yield* waitFor(() => host.querySelector(IDENTITY_ITEM_TAG) === null, "nested empty update");

      assert.strictEqual(c.isConnected, false);
      assert.strictEqual(original.get("a")?.isConnected, false);
      assert.strictEqual(replaced.get("d")?.isConnected, false);
      assert.strictEqual(countsFor("a").disconnected, 1);
      assert.strictEqual(countsFor("b").disconnected, 1);
      assert.strictEqual(countsFor("c").disconnected, supportsStatePreservingMove ? 1 : 2);
      assert.strictEqual(countsFor("d").disconnected, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves each node and local state in a keyed multi-root item", () =>
    Effect.gen(function* () {
      const host = makeHost();
      const items = yield* RefSubject.make<ReadonlyArray<Item>>(initialItems);
      const eventCounts = new Map<string, number>();

      const view = html`<form data-list>
        ${many(
          items,
          (item) => item.id,
          (item, key) =>
            Fx.gen(function* () {
              const localCount = yield* RefSubject.make(0);
              const label = RefSubject.map(item, (value) => value.label);
              const increment = Effect.all(
                [
                  RefSubject.update(localCount, (count) => count + 1),
                  Effect.sync(() => eventCounts.set(key, (eventCounts.get(key) ?? 0) + 1)),
                ],
                { discard: true },
              );
              return html`<span data-label=${key}>${label}</span
                ><button type="button" data-increment=${key} onclick=${increment}>increment</button
                ><input name=${key} data-input=${key} value=${`draft-${key}`} /><output
                  data-count=${key}
                  >${localCount}</output
                >`;
            }),
        )}
      </form>`;

      yield* mount(view, host);
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(itemOrder(host, "[data-label]")).toEqual(["a", "b", "c"])),
      );

      const form = requiredElement<HTMLFormElement>(host, "form[data-list]");
      const originalLabels = elementsByDataKey<HTMLElement>(host, "label");
      const originalButtons = elementsByDataKey<HTMLButtonElement>(host, "increment");
      const originalInputs = elementsByDataKey<HTMLInputElement>(host, "input");
      const cInput = originalInputs.get("c")!;
      const cButton = originalButtons.get("c")!;

      cInput.value = "typed-c";
      cInput.setSelectionRange(1, 5);
      cInput.setCustomValidity("multi-root-invalid");
      cInput.focus();
      cButton.click();
      yield* waitFor(
        () => requiredElement(host, "[data-count=c]").textContent === "1",
        "multi-root local count after first click",
      );

      yield* RefSubject.set(items, reorderedItems);
      yield* waitFor(
        () => itemOrder(host, "[data-label]").join(",") === "c,a,b",
        "multi-root first reorder",
      );

      const reorderedLabels = elementsByDataKey<HTMLElement>(host, "label");
      const reorderedButtons = elementsByDataKey<HTMLButtonElement>(host, "increment");
      const reorderedInputs = elementsByDataKey<HTMLInputElement>(host, "input");
      for (const key of ["a", "b", "c"] as const) {
        assert.strictEqual(reorderedLabels.get(key), originalLabels.get(key));
        assert.strictEqual(reorderedButtons.get(key), originalButtons.get(key));
        assert.strictEqual(reorderedInputs.get(key), originalInputs.get(key));
      }
      assert.strictEqual(document.activeElement, cInput);
      assert.strictEqual(cInput.value, "typed-c");
      assert.strictEqual(cInput.selectionStart, 1);
      assert.strictEqual(cInput.selectionEnd, 5);
      assert(cInput.validity.customError);
      assert.strictEqual(new FormData(form).get("c"), "typed-c");

      cButton.click();
      yield* waitFor(
        () => requiredElement(host, "[data-count=c]").textContent === "2",
        "multi-root local count after second click",
      );
      assert.strictEqual(eventCounts.get("c"), 2);

      yield* RefSubject.set(items, replacedItems);
      yield* Effect.promise(() =>
        vi.waitFor(() =>
          expect(itemOrder(host, "[data-label]"), "multi-root replacement").toEqual([
            "c",
            "a",
            "d",
          ]),
        ),
      );

      const replacedLabels = elementsByDataKey<HTMLElement>(host, "label");
      assert.strictEqual(replacedLabels.get("c"), originalLabels.get("c"));
      assert.strictEqual(replacedLabels.get("a"), originalLabels.get("a"));
      assert.strictEqual(originalLabels.get("b")?.isConnected, false);
      assert.strictEqual(replacedLabels.get("a")?.textContent, "A2");
      assert.strictEqual(cInput.value, "typed-c");
      assert.strictEqual(requiredElement(host, "[data-count=c]").textContent, "2");

      yield* RefSubject.set(items, []);
      yield* waitFor(() => host.querySelector("[data-label]") === null, "multi-root empty update");
      assert.strictEqual(cInput.isConnected, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("documents that unkeyed switching replaces identity and local browser state", () =>
    Effect.gen(function* () {
      const host = makeHost();
      const items = yield* RefSubject.make<ReadonlyArray<Item>>(initialItems);
      const eventCounts = new Map<string, number>();
      const renderedItems = Fx.switchMap(items, (values) =>
        Fx.tuple(
          ...values.map((item) =>
            Fx.gen(function* () {
              const localCount = yield* RefSubject.make(0);
              const increment = Effect.all(
                [
                  RefSubject.update(localCount, (count) => count + 1),
                  Effect.sync(() => eventCounts.set(item.id, (eventCounts.get(item.id) ?? 0) + 1)),
                ],
                { discard: true },
              );
              return html`<article data-key=${item.id}>
                <span data-label=${item.id}>${item.label}</span>
                <input data-input=${item.id} value=${`draft-${item.id}`} />
                <button type="button" data-increment=${item.id} onclick=${increment}>
                  increment
                </button>
                <output data-count=${item.id}>${localCount}</output>
              </article>`;
            }),
          ),
        ),
      );
      const view = html`<section data-list>${renderedItems}</section>`;

      yield* mount(view, host);
      yield* waitFor(() => itemOrder(host, "article[data-key]").join(",") === "a,b,c");

      const original = elementsByKey<HTMLElement>(host, "article[data-key]");
      const originalA = original.get("a")!;
      const originalAInput = requiredElement<HTMLInputElement>(originalA, "[data-input=a]");
      originalAInput.value = "typed-a";
      originalAInput.focus();
      requiredElement<HTMLButtonElement>(originalA, "[data-increment=a]").click();
      yield* waitFor(() => requiredElement(originalA, "[data-count=a]").textContent === "1");

      yield* RefSubject.set(items, reorderedItems);
      yield* waitFor(() => itemOrder(host, "article[data-key]").join(",") === "c,a,b");

      const reordered = elementsByKey<HTMLElement>(host, "article[data-key]");
      for (const key of ["a", "b", "c"] as const) {
        assert.notStrictEqual(reordered.get(key), original.get(key));
        assert.strictEqual(original.get(key)?.isConnected, false);
      }
      assert.strictEqual(document.activeElement, document.body);
      assert.strictEqual(
        requiredElement<HTMLInputElement>(host, "[data-input=a]").value,
        "draft-a",
      );
      assert.strictEqual(requiredElement(host, "[data-count=a]").textContent, "0");
      assert.strictEqual(eventCounts.get("a"), 1);

      const reorderedC = reordered.get("c")!;
      const reorderedCInput = requiredElement<HTMLInputElement>(reorderedC, "[data-input=c]");
      reorderedCInput.value = "typed-c";
      requiredElement<HTMLButtonElement>(reorderedC, "[data-increment=c]").click();
      yield* waitFor(() => requiredElement(reorderedC, "[data-count=c]").textContent === "1");

      yield* RefSubject.set(items, replacedItems);
      yield* waitFor(() => itemOrder(host, "article[data-key]").join(",") === "c,a,d");

      const replaced = elementsByKey<HTMLElement>(host, "article[data-key]");
      assert.notStrictEqual(replaced.get("c"), reorderedC);
      assert.strictEqual(reorderedC.isConnected, false);
      assert.strictEqual(
        requiredElement<HTMLInputElement>(host, "[data-input=c]").value,
        "draft-c",
      );
      assert.strictEqual(requiredElement(host, "[data-count=c]").textContent, "0");
      assert.strictEqual(requiredElement(host, "[data-label=a]").textContent, "A2");
      assert.strictEqual(eventCounts.get("c"), 1);

      yield* RefSubject.set(items, []);
      yield* waitFor(() => host.querySelector("article[data-key]") === null);
      assert.strictEqual(replaced.get("c")?.isConnected, false);
      assert.strictEqual(replaced.get("a")?.isConnected, false);
      assert.strictEqual(replaced.get("d")?.isConnected, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("fails a live keyed update with duplicate keys without corrupting the mounted list", () =>
    Effect.gen(function* () {
      const host = makeHost();
      const items = yield* RefSubject.make<ReadonlyArray<Item>>(initialItems);
      const mounted = yield* Deferred.make<void>();
      const view = html`<div data-list>
        ${many(
          items,
          (item) => item.id,
          (item, key) =>
            html`<span data-key=${key}>${RefSubject.map(item, (value) => value.label)}</span>`,
        )}
      </div>`;

      const fiber = yield* observeMounted(view, host, mounted).pipe(Effect.forkScoped);
      yield* Deferred.await(mounted);
      yield* waitFor(() => itemOrder(host, "span[data-key]").join(",") === "a,b,c");
      const original = elementsByKey<HTMLElement>(host, "span[data-key]");

      yield* RefSubject.set(items, [
        { id: "a", label: "first" },
        { id: "a", label: "second" },
      ]);

      const exit = yield* Fiber.await(fiber);
      assert(Exit.isFailure(exit));
      const error = Cause.squash(exit.cause);
      assert(Cause.isIllegalArgumentError(error));
      expect(error.message).toBe('Duplicate keyed() key "a"');
      assert.deepStrictEqual(itemOrder(host, "span[data-key]"), ["a", "b", "c"]);
      for (const key of ["a", "b", "c"] as const) {
        assert.strictEqual(elementsByKey(host, "span[data-key]").get(key), original.get(key));
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not publish unchanged item data during a pure keyed reorder", () =>
    Effect.gen(function* () {
      const host = makeHost();
      const items = yield* RefSubject.make<ReadonlyArray<Item>>(initialItems);
      const emissions = new Map<string, number>();
      const view = html`${many(
        items,
        (item) => item.id,
        (item, key) =>
          html`<span data-key=${key}
            >${RefSubject.map(item, (value) => {
              emissions.set(key, (emissions.get(key) ?? 0) + 1);
              return value.label;
            })}</span
          >`,
      )}`;

      yield* mount(view, host);
      yield* waitFor(() => itemOrder(host, "span[data-key]").join(",") === "a,b,c");
      expect(Object.fromEntries(emissions)).toEqual({ a: 1, b: 1, c: 1 });

      yield* RefSubject.set(items, reorderedItems);
      yield* waitFor(() => itemOrder(host, "span[data-key]").join(",") === "c,a,b");
      expect(Object.fromEntries(emissions)).toEqual({ a: 1, b: 1, c: 1 });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders many at root and recursively wrapped DOM Renderable boundaries", () =>
    Effect.gen(function* () {
      const directHost = makeHost();
      const wrappedHost = makeHost();
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          directHost.remove();
          wrappedHost.remove();
        }),
      );
      const list = many(
        Fx.succeed(initialItems),
        (item) => item.id,
        (item, key) => html`<span data-key=${key}>${RefSubject.map(item, (_) => _.label)}</span>`,
      );

      yield* render(list, directHost).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.observe(() => Effect.void),
        Effect.forkScoped,
      );
      yield* render(Effect.succeed([Option.some(list)]), wrappedHost).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.observe(() => Effect.void),
        Effect.forkScoped,
      );

      yield* waitFor(
        () =>
          itemOrder(directHost, "span[data-key]").join(",") === "a,b,c" &&
          itemOrder(wrappedHost, "span[data-key]").join(",") === "a,b,c",
      );
    }).pipe(Effect.scoped, Effect.runPromise));
});

function countsFor(key: string): LifecycleCounts {
  let counts = lifecycle.get(key);
  if (counts === undefined) {
    counts = { connected: 0, disconnected: 0, moved: 0 };
    lifecycle.set(key, counts);
  }
  return counts;
}

function makeHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function mount<E, R>(view: Fx.Fx<any, E, R>, host: HTMLElement) {
  return Effect.gen(function* () {
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    const mounted = yield* Deferred.make<void>();
    const fiber = yield* observeMounted(view, host, mounted).pipe(Effect.forkScoped);
    yield* Deferred.await(mounted);
    return fiber;
  });
}

function observeMounted<E, R>(
  view: Fx.Fx<any, E, R>,
  host: HTMLElement,
  mounted: Deferred.Deferred<void>,
) {
  return render(view, host).pipe(
    Fx.provide(DomRenderTemplate.using(document)),
    Fx.observe(() => Deferred.succeed(mounted, undefined)),
  );
}

function requiredElement<T extends Element = Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);
  assert(element, `Expected ${selector}`);
  return element as T;
}

function elementsByKey<T extends HTMLElement>(root: ParentNode, selector: string): Map<string, T> {
  return new Map(
    Array.from(root.querySelectorAll<T>(selector), (element) => [element.dataset["key"]!, element]),
  );
}

function elementsByDataKey<T extends HTMLElement>(
  root: ParentNode,
  key: "input" | "increment" | "label",
): Map<string, T> {
  return new Map(
    Array.from(root.querySelectorAll<T>(`[data-${key}]`), (element) => [
      element.dataset[key]!,
      element,
    ]),
  );
}

function itemOrder(root: ParentNode, selector: string): Array<string> {
  return Array.from(root.querySelectorAll<HTMLElement>(selector), (element) =>
    selector === "[data-label]" ? element.dataset["label"]! : element.dataset["key"]!,
  );
}

function waitFor(predicate: () => boolean, message = "condition was not met"): Effect.Effect<void> {
  return Effect.promise(() =>
    vi.waitFor(() => {
      assert(predicate(), message);
    }),
  );
}
