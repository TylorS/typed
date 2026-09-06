import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import { Fx, RefSubject } from "@typed/fx";
import { expect, it, vi } from "vitest";
import {
  CurrentRenderQueue,
  DomRenderTemplate,
  HtmlRenderTemplate,
  html,
  many,
  render,
  renderToHtmlString,
  type Renderable,
} from "../index.js";
import { SyncRenderQueue } from "../RenderQueue.js";
import { Window } from "happy-dom";
import { DomRenderEvent } from "../RenderEvent.js";
import { persistent } from "../Wire.js";

const transitions = [
  { name: "empty", orders: [[], []] },
  { name: "initial append", orders: [[], [0, 1, 2, 3]] },
  {
    name: "append",
    orders: [
      [0, 1, 2],
      [0, 1, 2, 3, 4],
    ],
  },
  {
    name: "prepend",
    orders: [
      [2, 3, 4],
      [0, 1, 2, 3, 4],
    ],
  },
  {
    name: "insert middle",
    orders: [
      [0, 4],
      [0, 1, 2, 3, 4],
    ],
  },
  {
    name: "remove head",
    orders: [
      [0, 1, 2, 3],
      [2, 3],
    ],
  },
  {
    name: "remove tail",
    orders: [
      [0, 1, 2, 3],
      [0, 1],
    ],
  },
  {
    name: "remove middle",
    orders: [
      [0, 1, 2, 3, 4],
      [0, 4],
    ],
  },
  { name: "clear and refill", orders: [[0, 1, 2], [], [2, 0, 1]] },
  {
    name: "replace all",
    orders: [
      [0, 1, 2],
      [3, 4, 5],
    ],
  },
  {
    name: "reverse",
    orders: [
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
    ],
  },
  {
    name: "swap",
    orders: [
      [0, 1, 2, 3, 4],
      [0, 3, 2, 1, 4],
    ],
  },
  {
    name: "rotate left",
    orders: [
      [0, 1, 2, 3],
      [1, 2, 3, 0],
    ],
  },
  {
    name: "rotate right",
    orders: [
      [0, 1, 2, 3],
      [3, 0, 1, 2],
    ],
  },
  {
    name: "reorder with insertion",
    orders: [
      [0, 1, 2],
      [1, 0, 2, 3],
    ],
  },
  {
    name: "mixed replacement",
    orders: [
      [0, 1, 2, 3, 4],
      [3, 5, 0, 6, 2],
    ],
  },
  {
    name: "remove and re-add a key",
    orders: [
      [0, 1, 2],
      [0, 2],
      [2, 1, 0],
    ],
  },
];

for (const roots of [0, 1, 3]) {
  it.each(transitions)(
    `$name with ${roots} roots preserves keyed nodes and closes only removed scopes`,
    ({ orders }) =>
      Effect.gen(function* () {
        const document = makeDocument();
        const items = yield* RefSubject.make<ReadonlyArray<number>>(orders[0]);
        const live = new Map<number, Array<HTMLElement>>();
        const closed: Array<number> = [];
        const expectedClosed: Array<number> = [];
        const list = many(
          items,
          (key) => key,
          (_, key) =>
            Fx.gen(function* () {
              yield* Effect.addFinalizer(() =>
                Effect.sync(() => {
                  closed.push(key);
                }),
              );
              const nodes = Array.from({ length: roots }, (_, index) => {
                const node = document.createElement("span");
                node.textContent = `${key}:${index}`;
                return node;
              });
              live.set(key, nodes);
              const fragment = document.createDocumentFragment();
              fragment.append(...nodes);
              return Fx.succeed(DomRenderEvent(persistent(document, String(key), fragment)));
            }),
        );
        const renderer = yield* mount(list, document);
        let previous = orders[0];
        for (const next of orders) {
          const retained = new Map(live);
          expectedClosed.push(...previous.filter((key) => !next.includes(key)));
          yield* RefSubject.set(items, next);
          const expectedNodes = next.flatMap((key) => live.get(key)!);
          const actual = Array.from(document.querySelectorAll("span"));
          expect(actual).toHaveLength(expectedNodes.length);
          for (let index = 0; index < actual.length; index++)
            expect(actual[index]).toBe(expectedNodes[index]);
          for (const key of next) {
            if (previous.includes(key)) expect(live.get(key)).toBe(retained.get(key));
          }
          expect(closed).toEqual(expectedClosed);
          expect(renderer.pollUnsafe()).toBeUndefined();
          previous = next;
        }
      }).pipe(Effect.scoped, Effect.runPromise),
  );
}

function makeDocument() {
  return new Window().document as unknown as Document;
}

for (const hydrate of [false, true]) {
  it.each([false, true])(
    `replaces growing nested ranges and restores them (hydrate: ${hydrate}, empty: %s)`,
    (empty) =>
      Effect.gen(function* () {
        const document = makeDocument();
        const items = yield* RefSubject.make(["a", "b"]);
        const expanded = yield* RefSubject.make(true);
        const nested = yield* RefSubject.make([1]);
        const list = many(
          items,
          (key) => key,
          (_, key) =>
            Fx.if(expanded, {
              onTrue: html`<span>${key}</span>${many(
                  nested,
                  (n) => n,
                  (_, n) => html`<b>${n}</b>`,
                )}<i>${key}</i>`,
              onFalse: empty
                ? Fx.succeed(DomRenderEvent(document.createDocumentFragment()))
                : html`<em>${key}</em>`,
            }),
        );
        if (hydrate)
          document.body.innerHTML = yield* renderToHtmlString(list).pipe(
            Effect.provide(HtmlRenderTemplate),
          );
        const renderer = yield* mount(list, document);
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.querySelectorAll("b")).toHaveLength(2)),
        );
        yield* RefSubject.set(nested, [1, 2, 3]);
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.querySelectorAll("b")).toHaveLength(6)),
        );
        yield* RefSubject.set(expanded, false);
        yield* Effect.promise(() =>
          vi.waitFor(() => {
            expect(document.querySelectorAll("span, b, i")).toHaveLength(0);
            expect(document.querySelectorAll("em")).toHaveLength(empty ? 0 : 2);
          }),
        );
        yield* RefSubject.set(items, ["b", "a"]);
        yield* RefSubject.set(expanded, true);
        yield* Effect.promise(() =>
          vi.waitFor(() => {
            expect(
              Array.from(document.querySelectorAll("span"), (node) => node.textContent),
            ).toEqual(["b", "a"]);
            expect(document.querySelectorAll("b")).toHaveLength(6);
            expect(document.querySelectorAll("em")).toHaveLength(0);
          }),
        );
        yield* RefSubject.set(items, []);
        expect(document.querySelectorAll("span, b, i, em")).toHaveLength(0);
        expect(renderer.pollUnsafe()).toBeUndefined();
      }).pipe(Effect.scoped, Effect.runPromise),
  );
}

function mount<E, R>(view: Renderable<unknown, E, R>, document: Document) {
  return Effect.gen(function* () {
    const mounted = yield* Deferred.make<void>();
    const fiber = yield* render(view, document.body).pipe(
      Fx.provide(
        Layer.merge(
          DomRenderTemplate.using(document),
          Layer.succeed(CurrentRenderQueue, new SyncRenderQueue()),
        ),
      ),
      Fx.observe(() => Deferred.succeed(mounted, undefined)),
      Effect.forkScoped,
    );
    yield* Deferred.await(mounted);
    return fiber;
  });
}

it("removes live ranges without awaiting finalizers and safely reuses their keys", () =>
  Effect.gen(function* () {
    const document = makeDocument();
    const items = yield* RefSubject.make(["a", "b"]);
    const nested = yield* RefSubject.make([1]);
    const closing = yield* Deferred.make<void>();
    const finish = yield* Deferred.make<void>();
    const closed = yield* Deferred.make<void>();
    const list = many(
      items,
      (key) => key,
      (_, key) =>
        Fx.gen(function* () {
          if (key === "a")
            yield* Effect.addFinalizer(() =>
              Effect.gen(function* () {
                yield* Deferred.succeed(closing, undefined);
                yield* Deferred.await(finish);
                yield* Deferred.succeed(closed, undefined);
              }),
            );
          return html`<span>${key}</span>${many(
              nested,
              (n) => n,
              (_, n) => html`<b>${n}</b>`,
            )}`;
        }),
    );
    const renderer = yield* mount(list, document);
    yield* Effect.promise(() =>
      vi.waitFor(() => expect(document.querySelectorAll("b")).toHaveLength(2)),
    );
    const removal = yield* RefSubject.set(items, []).pipe(Effect.forkScoped);
    yield* Deferred.await(closing);
    // Release the finalizer even when assertions fail, so the test cannot hang.
    yield* Effect.gen(function* () {
      yield* Fiber.join(removal).pipe(Effect.timeout("1 second"));
      expect(document.querySelectorAll("b")).toHaveLength(0);
      yield* RefSubject.set(items, ["a", "c"]);
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(document.querySelectorAll("b")).toHaveLength(2)),
      );
      yield* RefSubject.set(nested, [1, 2]);
      expect(renderer.pollUnsafe()).toBeUndefined();
      expect(document.querySelectorAll("b")).toHaveLength(4);
    }).pipe(Effect.ensuring(Deferred.succeed(finish, undefined)));
    yield* Deferred.await(closed);
    expect(renderer.pollUnsafe()).toBeUndefined();
    const retained = Array.from(document.querySelectorAll("span"));
    yield* RefSubject.set(items, ["c", "a"]);
    yield* Effect.promise(() =>
      vi.waitFor(() => {
        expect(document.querySelector("span")?.textContent).toBe("c");
        expect(document.querySelectorAll("b")).toHaveLength(4);
        expect(document.querySelectorAll("span")[0]).toBe(retained[1]);
        expect(document.querySelectorAll("span")[1]).toBe(retained[0]);
      }),
    );
  }).pipe(Effect.scoped, Effect.runPromise));

it("replaces unmatched hydrated child templates and can subsequently remove them", () =>
  Effect.gen(function* () {
    const document = makeDocument();
    const items = yield* RefSubject.make(["a", "b"]);
    let client = false;
    const list = many(
      items,
      (key) => key,
      (_, key) => (client ? html`<b>${key}</b>` : html`<span>${key}</span>`),
    );
    document.body.innerHTML = yield* renderToHtmlString(list).pipe(
      Effect.provide(HtmlRenderTemplate),
    );
    client = true;
    const renderer = yield* mount(list, document);
    yield* Effect.promise(() =>
      vi.waitFor(() =>
        expect(Array.from(document.querySelectorAll("b"), (node) => node.textContent)).toEqual([
          "a",
          "b",
        ]),
      ),
    );
    expect(document.querySelectorAll("span")).toHaveLength(0);
    yield* RefSubject.set(items, ["b", "a"]);
    expect(Array.from(document.querySelectorAll("b"), (node) => node.textContent)).toEqual([
      "b",
      "a",
    ]);
    yield* RefSubject.set(items, []);
    expect(document.querySelectorAll("b")).toHaveLength(0);
    expect(renderer.pollUnsafe()).toBeUndefined();
  }).pipe(Effect.scoped, Effect.runPromise));
