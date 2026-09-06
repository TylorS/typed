import { createElement, useLayoutEffect, useRef } from "react";
import { Deferred, Effect, Fiber } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { render } from "./native.js";
import { renderToHtmlString } from "./native.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { view } from "../view.js";

afterEach(() => document.body.replaceChildren());

describe("React mount placement", () => {
  it("closes an island scope when a pending sibling prevents root publication", () =>
    Effect.gen(function* () {
      let released = 0;
      let mounted = 0;
      const prepared = yield* Deferred.make<void>();
      function Field() {
        useLayoutEffect(() => {
          mounted++;
        }, []);
        return createElement("input");
      }
      const props = Effect.acquireRelease(Effect.succeed({}), () =>
        Effect.sync(() => {
          released++;
        }),
      );
      const island = view(Field, props, { id: "react-prepared-cancel" }).pipe(
        Fx.tap(() => Deferred.succeed(prepared, undefined)),
      );
      const page = html`<main>${island}${Effect.never}</main>`;
      const running = yield* render(page, document.body).pipe(
        Fx.drain,
        Effect.scoped,
        Effect.forkScoped,
      );
      yield* Deferred.await(prepared);
      yield* Fiber.interrupt(running);
      expect(document.body.querySelector("main")).toBeNull();
      expect(mounted).toBeLessThanOrEqual(1);
      expect(released).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));
  for (const mode of ["direct", "nested", "hydrated", "detached"] as const) {
    it(`retains one React mount in a ${mode} native destination`, () =>
      Effect.gen(function* () {
        const target = document.createElement("main");
        if (mode !== "detached") document.body.append(target);
        const observations: Array<{
          placed: boolean;
          connected: boolean;
          width: number;
          focused: boolean;
        }> = [];
        function Field() {
          const input = useRef<HTMLInputElement>(null);
          useLayoutEffect(() => {
            const element = input.current!;
            element.focus();
            observations.push({
              placed: target.contains(element),
              connected: element.isConnected,
              width: element.getBoundingClientRect().width,
              focused: document.activeElement === element,
            });
          }, []);
          return createElement("input", { ref: input, style: { width: "120px" } });
        }
        const island = view(Field, {}, { id: `react-placement-${mode}` });
        const page = mode === "direct" ? island : html`<section>${island}</section>`;
        if (mode === "hydrated")
          target.innerHTML = yield* renderToHtmlString(page).pipe(Effect.scoped);
        const original = target.querySelector("input");
        yield* render(page, target).pipe(Fx.take(1), Fx.drain);
        yield* Effect.promise(() => vi.waitFor(() => expect(observations).toHaveLength(1)));
        // Native template insertion and React's commit have independent timing.
        const input = target.querySelector("input")!;
        expect(target.contains(input)).toBe(true);
        expect(input.isConnected).toBe(mode !== "detached");
        if (mode !== "detached") {
          expect(input.getBoundingClientRect().width).toBeGreaterThan(0);
          input.focus();
          expect(document.activeElement).toBe(input);
        }
        if (original) expect(target.querySelector("input")).toBe(original);
      }).pipe(Effect.scoped, Effect.runPromise));
  }

  it("mounts later keyed islands and preserves their hooks on moves", () =>
    Effect.gen(function* () {
      const mounted: string[] = [];
      const items = yield* RefSubject.make<ReadonlyArray<string>>([]);
      function Field({ name }: { name: string }) {
        const input = useRef<HTMLInputElement>(null);
        useLayoutEffect(() => {
          const element = input.current!;
          element.focus();
          mounted.push(name);
        }, []);
        return createElement("input", { ref: input, "data-name": name, style: { width: "120px" } });
      }
      const page = html`<section>
        ${many(
          items,
          (name) => name,
          (_, name) => view(Field, { name }, { id: `react-keyed-${name}` }),
        )}
      </section>`;
      yield* render(page, document.body).pipe(Fx.take(1), Fx.drain);
      yield* RefSubject.set(items, ["a", "b"]);
      yield* Effect.promise(() => vi.waitFor(() => expect(mounted).toEqual(["a", "b"])));
      const inputs = Array.from(document.querySelectorAll("input"));
      yield* RefSubject.set(items, ["b", "a"]);
      yield* Effect.promise(() =>
        vi.waitFor(() =>
          expect(Array.from(document.querySelectorAll("input"))).toEqual([inputs[1], inputs[0]]),
        ),
      );
      expect(mounted).toEqual(["a", "b"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
