import { describe, expect, it, vi } from "vitest";
import { Deferred, Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import {
  EventHandler,
  html,
  HtmlRenderTemplate,
  many,
  render,
  renderToHtmlString,
} from "../../index.js";
import type { Renderable } from "../../Renderable.js";
import { parse } from "../../Parser.js";
import { createHappyDomLayer } from "../../__tests__/helpers/dom-layer.js";
import { findHydratePath, findHydrationTemplate, getHydrationRoot } from "../hydration.js";

const recorded = <const V extends ReadonlyArray<Renderable.Any>>(
  strings: TemplateStringsArray,
  ...values: V
) => ({ template: parse(strings), view: html(strings, ...values) });

const cases = [
  ["primitive child", () => recorded`<section>${"child"}<input title=${"target"}></section>`],
  ["empty child", () => recorded`<section>${null}<input title=${"target"}></section>`],
  [
    "nested template",
    () => recorded`<section>${html`<b>child</b>`}<input title=${"target"}></section>`,
  ],
  [
    "multiline nested template",
    () => recorded`<section>
    ${html`<b>child</b>`}
    <input title=${"target"}>
  </section>`,
  ],
  [
    "multiple nested nodes",
    () => recorded`<section>${html`<b>one</b><i>two</i>`}<input title=${"target"}></section>`,
  ],
  ["root-level hole", () => recorded`${html`<b>child</b>`}<input title=${"target"}>`],
  [
    "multiple root siblings",
    () => recorded`<header>Header</header>${html`<b>child</b>`}<input title=${"target"}>`,
  ],
  [
    "adjacent holes and text",
    () =>
      recorded`<section>Before ${"first"}${html`<b>second</b>`} after<input title=${"target"}></section>`,
  ],
  [
    "nested keyed collection",
    () =>
      recorded`<section>${html`<ul>
        ${many(
          Fx.succeed([{ id: "a" }, { id: "b" }]),
          (value) => value.id,
          (_, key) => html`<li>${key}</li>`,
        )}
      </ul>`}<input title=${"target"}></section>`,
  ],
] as const;

describe("hydration paths after populated child holes", () => {
  for (const [name, create] of cases) {
    it(`adopts the attributed sibling after ${name}`, async () => {
      const { template, view } = create();
      const serialized = await view.pipe(
        renderToHtmlString,
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
        Effect.runPromise,
      );
      const [window, layer] = createHappyDomLayer();
      const host = window.document.body;
      host.innerHTML = serialized;
      const originalElements = Array.from(host.querySelectorAll("*"));
      const input = host.querySelector("input")!;
      const root = getHydrationRoot(host);
      const adopted = findHydrationTemplate(root.childNodes, template.hash)!;
      const attribute = template.parts.find(([part]) => part._tag === "attr");
      expect(attribute).toBeDefined();
      expect(findHydratePath(adopted, attribute![1])).toBe(input);

      await render(view, host).pipe(
        Fx.provide(layer),
        Fx.take(1),
        Fx.drain,
        Effect.scoped,
        Effect.runPromise,
      );
      const currentElements = Array.from(host.querySelectorAll("*"));
      expect(currentElements).toHaveLength(originalElements.length);
      currentElements.forEach((element, index) => expect(element).toBe(originalElements[index]));
      expect(Array.from(host.querySelectorAll("[title]"))).toEqual([input]);
      expect(input.getAttribute("title")).toBe("target");
    });
  }

  it("updates and handles native events on the retained static sibling", async () => {
    await Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const host = window.document.body;
      const title = yield* RefSubject.make("initial");
      const calls: EventTarget[] = [];
      const onInput = EventHandler.make((event: Event) => {
        calls.push(event.currentTarget!);
      });
      const view = html`<section>
        ${html`<b>Foreign child</b>`}
        <label>Search <input title=${title} oninput=${onInput} /></label>
      </section>`;
      host.innerHTML = yield* view.pipe(renderToHtmlString, Effect.provide(HtmlRenderTemplate));
      const input = host.querySelector("input")!;
      const child = host.querySelector("b")!;
      const mounted = yield* Deferred.make<void>();
      yield* render(view, host).pipe(
        Fx.provide(layer),
        Fx.observe(() => Deferred.succeed(mounted, undefined)),
        Effect.forkScoped,
      );
      yield* Deferred.await(mounted);
      expect(host.querySelector("input")).toBe(input);
      expect(host.querySelector("b")).toBe(child);
      yield* RefSubject.set(title, "updated");
      yield* Effect.promise(() => vi.waitFor(() => expect(input.title).toBe("updated")));
      expect(child.hasAttribute("title")).toBe(false);
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
      yield* Effect.promise(() => vi.waitFor(() => expect(calls).toEqual([input])));
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});
