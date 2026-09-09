import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import {
  DomRenderTemplate,
  HtmlRenderTemplate,
  html,
  many,
  render,
  renderToHtmlString,
} from "../index.js";
import { DomRenderEvent } from "../RenderEvent.js";

it.each([false, true])(
  "keeps 128 rows responsive while native toggles remove filtered items (distinct condition: %s)",
  (distinct) =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      const list = yield* RefSubject.make(
        Array.from({ length: 128 }, (_, id) => ({ id, completed: false })),
      );
      const filter = yield* RefSubject.make<"all" | "active" | "completed">("all");
      const hasItems = RefSubject.map(list, (items) => items.length > 0);
      const visible = RefSubject.map(RefSubject.struct({ list, filter }), ({ list, filter }) =>
        filter === "all"
          ? list
          : list.filter((item) => item.completed === (filter === "completed")),
      );
      const body = html`<ul>
          ${many(
            visible,
            (item) => item.id,
            (item, id) => html`<li>
              <input
                type="checkbox"
                data-id=${id}
                ?checked=${RefSubject.map(item, (item) => item.completed)}
                onchange=${RefSubject.update(list, (items) => items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))}
              />
            </li>`,
          )}
        </ul>
        <strong
          >${RefSubject.map(list, (items) => items.filter((item) => !item.completed).length)}</strong
        >`;
      const view = html`<main>
        ${Fx.if(distinct ? Fx.skipRepeats(hasItems) : hasItems, { onTrue: body, onFalse: Fx.null })}
      </main>`;
      const renderer = yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.drain,
        Effect.forkScoped,
      );
      const assertRows = (count: number, active: number) =>
        Effect.promise(() =>
          vi.waitFor(() => {
            expect(host.querySelectorAll("li")).toHaveLength(count);
            expect(host.querySelector("strong")?.textContent).toBe(String(active));
            expect(renderer.pollUnsafe()).toBeUndefined();
          }),
        );
      yield* assertRows(128, 128);
      for (let cycle = 0; cycle < 4; cycle++) {
        // Browser-dispatched input observes the mounted control after a conditional replacement.
        yield* Effect.promise(() => userEvent.click(host.querySelector<HTMLInputElement>("input")!));
        expect((yield* list).filter((item) => !item.completed)).toHaveLength(127);
        yield* assertRows(128, 127);
        yield* RefSubject.set(filter, "completed");
        yield* assertRows(1, 127);
        expect(host.querySelector<HTMLInputElement>("input")!.checked).toBe(true);
        yield* Effect.promise(() => userEvent.click(host.querySelector<HTMLInputElement>("input")!));
        expect((yield* list).filter((item) => !item.completed)).toHaveLength(128);
        yield* assertRows(0, 128);
        yield* RefSubject.set(filter, "active");
        yield* assertRows(128, 128);
        yield* Effect.promise(() => userEvent.click(host.querySelector<HTMLInputElement>("input")!));
        expect((yield* list).filter((item) => !item.completed)).toHaveLength(127);
        yield* assertRows(127, 127);
        yield* RefSubject.set(filter, "completed");
        yield* assertRows(1, 127);
        yield* Effect.promise(() => userEvent.click(host.querySelector<HTMLInputElement>("input")!));
        expect((yield* list).filter((item) => !item.completed)).toHaveLength(128);
        yield* assertRows(0, 128);
        yield* RefSubject.set(filter, "all");
        yield* assertRows(128, 128);
      }
    }).pipe(Effect.scoped, Effect.runPromise),
);

it("allows a yielded native handler to remove the last keyed child and its conditional parent", () =>
  Effect.gen(function* () {
    const host = document.createElement("div");
    document.body.append(host);
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    const items = yield* RefSubject.make([1]);
    let finalized = 0;
    const remove = Effect.gen(function* () {
      yield* Effect.yieldNow;
      yield* RefSubject.set(items, []);
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          finalized++;
        }),
      ),
    );
    const view = html`<main>
      ${Fx.if(Fx.skipRepeats(RefSubject.map(items, (items) => items.length > 0)), {
        onTrue: html`<section>
          ${many(
            items,
            (id) => id,
            () => html`<button onclick=${remove}>Remove</button>`,
          )}
        </section>`,
        onFalse: Fx.null,
      })}
    </main>`;
    const renderer = yield* render(view, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.drain,
      Effect.forkScoped,
    );
    yield* Effect.promise(() =>
      vi.waitFor(() => expect(host.querySelector("button")).not.toBeNull()),
    );
    host.querySelector("button")!.click();
    yield* Effect.promise(() =>
      vi.waitFor(() => {
        expect(host.querySelector("section")).toBeNull();
        expect(finalized).toBe(1);
        expect(renderer.pollUnsafe()).toBeUndefined();
      }),
    );
    yield* RefSubject.set(items, [2]);
    yield* Effect.promise(() =>
      vi.waitFor(() => expect(host.querySelector("button")).not.toBeNull()),
    );
  }).pipe(Effect.scoped, Effect.runPromise));

it.each([false, true])(
  "moves and removes live keyed ranges after nested growth (hydrate: %s)",
  (hydrate) =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      const items = yield* RefSubject.make(["a", "b", "c"]);
      const nested = yield* RefSubject.make([1]);
      const mounted = yield* Deferred.make<void>();
      const view = html`<div>
        ${many(
          items,
          (key) => key,
          (_, key) =>
            html`<span>${key}</span>${many(
                nested,
                (n) => n,
                (_, n) => html`<b>${key}${n}</b>`,
              )}<i>${key}</i>`,
        )}
      </div>`;
      if (hydrate)
        host.innerHTML = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.observe(() => Deferred.succeed(mounted, undefined)),
        Effect.forkScoped,
      );
      yield* Deferred.await(mounted);
      yield* Effect.promise(() =>
        vi.waitFor(() => {
          expect(host.querySelectorAll("b")).toHaveLength(3);
          expect(host.querySelectorAll("i")).toHaveLength(3);
        }),
      );
      yield* RefSubject.set(nested, [1, 2, 3]);
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(host.querySelectorAll("b")).toHaveLength(9)),
      );
      const original = Array.from(host.querySelectorAll("b"));
      yield* RefSubject.set(items, ["c", "a", "b"]);
      yield* Effect.promise(() =>
        vi.waitFor(() =>
          expect(Array.from(host.querySelectorAll("b"), (_) => _.textContent)).toEqual([
            "c1",
            "c2",
            "c3",
            "a1",
            "a2",
            "a3",
            "b1",
            "b2",
            "b3",
          ]),
        ),
      );
      expect(Array.from(host.querySelectorAll("b"))).toEqual([
        ...original.slice(6),
        ...original.slice(0, 6),
      ]);
      yield* RefSubject.set(items, []);
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(host.querySelectorAll("b")).toHaveLength(0)),
      );
    }).pipe(Effect.scoped, Effect.runPromise),
);

it("keeps pending and empty children in keyed order and cancels removed children", () =>
  Effect.gen(function* () {
    const host = document.createElement("div");
    document.body.append(host);
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    const items = yield* RefSubject.make(["a", "b", "c"]);
    const gates = new Map<string, Deferred.Deferred<void>>();
    const children = new Map<string, RefSubject.RefSubject<boolean>>();
    const closed: Array<string> = [];
    for (const key of ["a", "b", "c"]) {
      gates.set(key, yield* Deferred.make<void>());
      children.set(key, yield* RefSubject.make(true));
    }
    const mounted = yield* Deferred.make<void>();
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
          yield* Deferred.await(gates.get(key)!);
          return Fx.map(children.get(key)!, (visible) => {
            const fragment = document.createDocumentFragment();
            if (visible) {
              const node = document.createElement("span");
              node.textContent = key;
              fragment.append(node);
            }
            return DomRenderEvent(fragment);
          });
        }),
    );
    yield* render(list, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.observe(() => Deferred.succeed(mounted, undefined)),
      Effect.forkScoped,
    );
    yield* Deferred.await(mounted);
    yield* Deferred.succeed(gates.get("c")!, undefined);
    yield* Effect.promise(() => vi.waitFor(() => expect(host.textContent).toBe("c")));
    yield* RefSubject.set(items, ["c", "a"]);
    expect(closed).toEqual(["b"]);
    yield* Deferred.succeed(gates.get("b")!, undefined);
    yield* Deferred.succeed(gates.get("a")!, undefined);
    yield* Effect.promise(() => vi.waitFor(() => expect(host.textContent).toBe("ca")));
    yield* RefSubject.set(children.get("c")!, false);
    expect(host.textContent).toBe("a");
    yield* RefSubject.set(items, ["a", "c"]);
    yield* RefSubject.set(children.get("c")!, true);
    expect(host.textContent).toBe("ac");
    yield* RefSubject.set(items, []);
    expect(host.textContent).toBe("");
    expect(closed.slice().sort()).toEqual(["a", "b", "c"]);
  }).pipe(Effect.scoped, Effect.runPromise));

it("retains focused inputs and child scopes through map-fallback reorders", () =>
  Effect.gen(function* () {
    const host = document.createElement("div");
    document.body.append(host);
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    const items = yield* RefSubject.make(["a", "b", "c", "d"]);
    const mounted = yield* Deferred.make<void>();
    const nodes = new Map<string, HTMLInputElement>();
    const closed: Array<string> = [];
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
          const node = document.createElement("input");
          node.value = key;
          nodes.set(key, node);
          return Fx.succeed(DomRenderEvent(node));
        }),
    );
    yield* render(list, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.observe(() => Deferred.succeed(mounted, undefined)),
      Effect.forkScoped,
    );
    yield* Deferred.await(mounted);
    nodes.get("a")!.focus();
    nodes.get("a")!.setSelectionRange(0, 1);
    for (const order of [
      ["b", "d", "a", "c"],
      ["c", "a", "d", "b"],
      ["a", "c", "b", "d"],
    ]) {
      yield* RefSubject.set(items, order);
      expect(Array.from(host.children)).toEqual(order.map((key) => nodes.get(key)));
      expect(document.activeElement).toBe(nodes.get("a"));
      expect(nodes.get("a")!.selectionEnd).toBe(1);
      expect(closed).toEqual([]);
    }
  }).pipe(Effect.scoped, Effect.runPromise));
