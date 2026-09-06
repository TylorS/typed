import { Fx } from "@typed/fx";
import { Effect } from "effect";
import { expect, it } from "vitest";
import {
  DomRenderTemplate,
  html,
  HtmlRenderTemplate,
  render,
  renderToHtmlString,
} from "../index.js";

for (const multiple of [false, true]) {
  it(`preserves early input and focus when hydrating ${multiple ? "multiple roots" : "one root"}`, () =>
    Effect.gen(function* () {
      const view = multiple
        ? html`<label for="early-input">Email</label><input id="early-input" type="text" />
            <p>Hint</p>`
        : html`<form><input type="text" /></form>`;
      const host = document.createElement("div");
      document.body.append(host);
      yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
      host.innerHTML = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
      const input = host.querySelector("input")!;
      input.value = "An early draft";
      input.focus();
      input.setSelectionRange(3, 8);
      expect(document.activeElement).toBe(input);
      yield* render(view, host).pipe(
        Fx.provide(DomRenderTemplate.using(document)),
        Fx.take(1),
        Fx.collectUpTo(1),
      );
      expect(host.querySelector("input")).toBe(input);
      expect(input.value).toBe("An early draft");
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd]).toEqual([3, 8]);
    }).pipe(Effect.scoped, Effect.runPromise));
}

it("mounts fresh content and replaces a different root", () =>
  Effect.gen(function* () {
    const host = document.createElement("div");
    document.body.append(host);
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    yield* render(html`<p>First</p>`, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.take(1),
      Fx.collectUpTo(1),
    );
    const first = host.firstChild;
    expect(host.textContent).toBe("First");
    yield* render(html`<section>Second</section>`, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.take(1),
      Fx.collectUpTo(1),
    );
    expect(host.textContent).toBe("Second");
    expect(host.querySelector("section")).not.toBeNull();
    expect(first?.isConnected).toBe(false);
  }).pipe(Effect.scoped, Effect.runPromise));
