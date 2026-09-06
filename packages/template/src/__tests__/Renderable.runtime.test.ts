import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";
import { describe, expect, it } from "vitest";
import {
  html,
  HtmlRenderEvent,
  many,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "../index.js";

describe("Renderable runtime", () => {
  it("represents a keyed list as a renderer built-in instead of an Fx", () => {
    const list = many(
      Fx.succeed([{ id: "a" }]),
      (item) => item.id,
      (item) => html`<span>${item}</span>`,
    );

    expect(Fx.isFx(list)).toBe(false);
  });

  it("renders many at root and recursively wrapped Renderable boundaries", () =>
    Effect.gen(function* () {
      const list = many(
        Fx.succeed([{ id: "a" }, { id: "b" }]),
        (item) => item.id,
        (item, key) => html`<span data-key=${key}>${item}</span>`,
      );

      const direct = yield* renderToHtmlString(list).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );
      const wrapped = yield* renderToHtmlString([Option.some(list)]).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );
      const effected = yield* renderToHtmlString(Effect.succeed(list)).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );

      expect(direct).toContain('data-key="a"');
      expect(direct).toContain('data-key="b"');
      expect(wrapped).toContain('data-key="a"');
      expect(wrapped).toContain('data-key="b"');
      expect(effected).toContain('data-key="a"');
      expect(effected).toContain('data-key="b"');
    }).pipe(Effect.scoped, Effect.runPromise));

  it("rejects local symbol keys during server rendering", () => {
    const localKey = Symbol("local");
    const list = many(
      Fx.succeed([{ key: localKey }]),
      (item) => item.key,
      () => html`<span>item</span>`,
    );

    return Effect.gen(function* () {
      const exit = yield* Effect.exit(
        renderToHtmlString(list).pipe(Effect.provide(StaticHtmlRenderTemplate)),
      );
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(String(exit.cause)).toContain("Local symbol keys cannot be hydrated");
      }
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("renders a root many whose item renderer has no template dependency", () => {
    const list = many(
      Fx.succeed([{ id: "a" }]),
      (item) => item.id,
      () => Fx.succeed(HtmlRenderEvent("<span>item</span>", true)),
    );

    return Effect.gen(function* () {
      const output = yield* renderToHtmlString(list).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );
      expect(output).toContain("<span>item</span>");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("keeps plain functions out of server-rendered node content", () => {
    const unsupported = () => "not lazy";

    return Effect.gen(function* () {
      const output = yield* renderToHtmlString(html`<div>${unsupported}</div>`).pipe(
        Effect.provide(StaticHtmlRenderTemplate),
      );
      expect(output).toBe("<div></div>");
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});
