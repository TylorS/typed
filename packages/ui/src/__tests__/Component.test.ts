import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import { component } from "../Component.js";

describe("typed/ui/Component", () => {
  it("creates an Fx directly from a zero-arity generator", () => {
    const Greeting = component(function* () {
      const name = yield* Effect.succeed("Typed");
      return [html`<strong>${name}</strong>`, " Welcome!"];
    });
    const window = makeWindow();

    assert.isTrue(Fx.isFx(Greeting));

    return Effect.gen(function* () {
      yield* render(Greeting, window.document.body).pipe(Fx.take(1), Fx.drain);

      assert.strictEqual(window.document.body.textContent, "Typed Welcome!");
      assert.strictEqual(window.document.body.querySelector("strong")?.textContent, "Typed");
    }).pipe(
      Effect.provide(DomRenderTemplate.using(window.document)),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("pipes a zero-arity component from its generated Fx", () => {
    const Greeting = component(
      // oxlint-disable-next-line require-yield
      function* () {
        return "Typed";
      },
      Fx.map((name) => `${name} Welcome!`),
    );
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;

    return Effect.gen(function* () {
      yield* render(Greeting, window.document.body).pipe(Fx.take(1), Fx.drain);

      assert.strictEqual(window.document.body.textContent, "Typed Welcome!");
    }).pipe(
      Effect.provide(DomRenderTemplate.using(window.document)),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("creates an Fx component whose generator can return any Renderable", () => {
    const Greeting = component(function* (name: string) {
      const punctuation = yield* Effect.succeed("!");
      return [html`<strong>${name}</strong>`, " Welcome", punctuation];
    });
    const window = makeWindow();

    return Effect.gen(function* () {
      yield* render(Greeting("Typed"), window.document.body).pipe(Fx.take(1), Fx.drain);

      assert.strictEqual(window.document.body.textContent, "Typed Welcome!");
      assert.strictEqual(window.document.body.querySelector("strong")?.textContent, "Typed");
    }).pipe(
      Effect.provide(DomRenderTemplate.using(window.document)),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("pipes an argument-taking component with its original arguments", () => {
    const Greeting = component(
      // oxlint-disable-next-line require-yield
      function* (name: string, _punctuation: string) {
        return name;
      },
      (fx, name, punctuation) => fx.pipe(Fx.map((value) => `${name}: ${value}${punctuation}`)),
      (fx, name, punctuation) => fx.pipe(Fx.map((value) => `${value} (${name}${punctuation})`)),
    );
    const window = new Window() as unknown as globalThis.Window & typeof globalThis;

    return Effect.gen(function* () {
      yield* render(Greeting("Typed", "!"), window.document.body).pipe(Fx.take(1), Fx.drain);

      assert.strictEqual(window.document.body.textContent, "Typed: Typed! (Typed!)");
    }).pipe(
      Effect.provide(DomRenderTemplate.using(window.document)),
      Effect.scoped,
      Effect.runPromise,
    );
  });
});

function makeWindow() {
  return new Window() as unknown as globalThis.Window & typeof globalThis;
}
