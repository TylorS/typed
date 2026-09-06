import { persistent } from "../Wire.js";
import { expect, it, vi } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import {
  html,
  HtmlRenderTemplate,
  renderToHtmlString,
  DomRenderTemplate,
  render,
} from "../index.js";

class Label extends Context.Service<Label, string>()("EffectChildLabel") {}

it.each([false, true])(
  "normalizes an Effect child template with services, updates, and scoped cleanup (hydrate=%s)",
  async (hydrate) => {
    const host = document.createElement("div");
    document.body.append(host);
    let finalized = 0;
    const view = html`<main>
      ${Effect.gen(function* () {
        const label = yield* Label;
        const count = yield* RefSubject.make(0);
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            finalized++;
          }),
        );
        return html`<button @click=${RefSubject.update(count, (n) => n + 1)}>
          ${label}: ${count}
        </button>`;
      })}
    </main>`;
    let original: HTMLButtonElement | null = null;
    try {
      if (hydrate) {
        host.innerHTML = await Effect.runPromise(
          renderToHtmlString(view).pipe(
            Effect.provide(HtmlRenderTemplate),
            Effect.provideService(Label, "Count"),
            Effect.scoped,
          ),
        );
        original = host.querySelector("button");
        expect(original?.textContent).toBe("Count: 0");
        expect(finalized).toBe(1);
      }
      await Effect.runPromise(
        Effect.gen(function* () {
          yield* render(view, host).pipe(Fx.take(1), Fx.collectAll);
          const button = host.querySelector("button");
          if (!button) throw new Error("Effect child did not render");
          if (hydrate) expect(button).toBe(original);
          expect(button.textContent).toBe("Count: 0");
          button.click();
          yield* Effect.promise(() =>
            vi.waitFor(() => expect(button.textContent).toBe("Count: 1")),
          );
          expect(finalized).toBe(hydrate ? 1 : 0);
        }).pipe(
          Effect.provide(DomRenderTemplate.using(document)),
          Effect.provideService(Label, "Count"),
          Effect.scoped,
        ),
      );
      expect(finalized).toBe(hydrate ? 2 : 1);
    } finally {
      host.remove();
    }
  },
);

it("preserves a nested Effect's typed failure", async () => {
  const host = document.createElement("div");
  const failure = { _tag: "ChildFailed" as const };
  let finalized = 0;
  const view = html`<main>
    ${Effect.gen(function* () {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          finalized++;
        }),
      );
      return yield* Effect.fail(failure);
    })}
  </main>`;
  const error = await Effect.runPromise(
    render(view, host).pipe(
      Fx.drain,
      Effect.provide(DomRenderTemplate.using(document)),
      Effect.scoped,
      Effect.flip,
    ),
  );
  expect(error).toBe(failure);
  const ssrError = await Effect.runPromise(
    renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.flip),
  );
  expect(ssrError).toBe(failure);
  expect(finalized).toBe(2);
});

it("keeps Effect results used as DOM properties as their original values", () =>
  Effect.gen(function* () {
    const host = document.createElement("div");
    const value = Fx.succeed("property value");
    yield* render(html`<div .payload=${Effect.succeed(value)}></div>`, host).pipe(
      Fx.take(1),
      Fx.collectAll,
    );
    const element = host.querySelector("div");
    if (!element) throw new Error("Missing property host");
    expect(Reflect.get(element, "payload")).toBe(value);
  }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise));

it.each(["node", "array", "fragment", "wire"] as const)(
  "retains existing %s identity when an Effect returns it as a child",
  (kind) =>
    Effect.gen(function* () {
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      const first = document.createElement("button");
      first.textContent = "First";
      const second = document.createElement("span");
      second.textContent = "Second";
      const clicked = vi.fn();
      first.addEventListener("click", clicked);
      const fragment = document.createDocumentFragment();
      fragment.append(first, second);
      const value: unknown =
        kind === "node"
          ? first
          : kind === "array"
            ? [first, second]
            : kind === "fragment"
              ? fragment
              : persistent(document, "borrowed", fragment);
      yield* render(html`<main>${Effect.succeed(value)}</main>`, host).pipe(
        Fx.take(1),
        Fx.collectAll,
      );
      expect(host.querySelector("button")).toBe(first);
      if (kind !== "node") expect(host.querySelector("span")).toBe(second);
      first.click();
      expect(clicked).toHaveBeenCalledOnce();
    }).pipe(
      Effect.provide(DomRenderTemplate.using(document)),
      Effect.scoped,
      Effect.timeout("2 seconds"),
      Effect.runPromise,
    ),
);
