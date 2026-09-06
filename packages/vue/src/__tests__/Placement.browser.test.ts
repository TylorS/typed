import { defineComponent, h, onMounted, shallowRef } from "vue";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template/RenderTemplate";
import { many } from "@typed/template/many";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { afterEach, describe, expect, it, vi } from "vitest";
import { view } from "../view.js";

afterEach(() => document.body.replaceChildren());

describe("Vue mount placement", () => {
  it("closes its native scope when a pending sibling prevents root publication", () =>
    Effect.gen(function* () {
      let released = 0;
      let mounted = 0;
      const prepared = yield* Deferred.make<void>();
      const Field = defineComponent({
        setup() {
          onMounted(() => {
            mounted++;
          });
          return () => h("input");
        },
      });
      const props = Effect.acquireRelease(Effect.succeed({}), () =>
        Effect.sync(() => {
          released++;
        }),
      );
      const island = view(Field, props, { id: "vue-prepared-cancel" }).pipe(
        Fx.tap(() => Deferred.succeed(prepared, undefined)),
      );
      const page = html`<main>${island}${Effect.never}</main>`;
      const running = yield* render(page, document.body).pipe(
        Fx.provide(DomRenderTemplate),
        Fx.drain,
        Effect.scoped,
        Effect.forkScoped,
      );
      yield* Deferred.await(prepared);
      yield* Fiber.interrupt(running);
      expect(mounted).toBe(1);
      expect(released).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));
  for (const mode of ["direct", "nested", "hydrated", "detached"] as const) {
    it(`preserves native ref timing and output identity in a ${mode} destination`, () =>
      Effect.gen(function* () {
        const target = document.createElement("main");
        if (mode !== "detached") document.body.append(target);
        const observations: Array<{
          placed: boolean;
          connected: boolean;
          width: number;
          focused: boolean;
        }> = [];
        const Field = defineComponent({
          setup() {
            const input = shallowRef<HTMLInputElement>();
            onMounted(() => {
              const element = input.value!;
              element.focus();
              observations.push({
                placed: target.contains(element),
                connected: element.isConnected,
                width: element.getBoundingClientRect().width,
                focused: document.activeElement === element,
              });
            });
            return () => h("input", { ref: input, style: { width: "120px" } });
          },
        });
        const island = view(Field, {}, { id: `vue-placement-${mode}` });
        const page = mode === "direct" ? island : html`<section>${island}</section>`;
        if (mode === "hydrated")
          target.innerHTML = yield* renderToHtmlString(page).pipe(
            Effect.provide(HtmlRenderTemplate),
            Effect.scoped,
            Effect.scoped,
          );
        const original = target.querySelector("input");
        yield* render(page, target).pipe(Fx.provide(DomRenderTemplate), Fx.take(1), Fx.drain);
        expect(observations).toHaveLength(1);
        // Native refs run before a new host is inserted; hydrated hosts are already placed.
        expect(observations[0]!.placed).toBe(mode === "hydrated");
        expect(observations[0]!.connected).toBe(mode === "hydrated");
        expect(observations[0]!.focused).toBe(mode === "hydrated");
        expect(target.querySelector("input")!.isConnected).toBe(mode !== "detached");
        if (mode !== "detached")
          expect(target.querySelector("input")!.getBoundingClientRect().width).toBeGreaterThan(0);
        if (original) expect(target.querySelector("input")).toBe(original);
      }).pipe(Effect.scoped, Effect.runPromise));
  }

  it("renders later keyed islands and preserves their mounted instances on moves", () =>
    Effect.gen(function* () {
      const mounted: string[] = [];
      const items = yield* RefSubject.make<ReadonlyArray<string>>([]);
      const Field = defineComponent({
        props: { name: { type: String, required: true } },
        setup(props) {
          const input = shallowRef<HTMLInputElement>();
          onMounted(() => {
            mounted.push(props.name);
          });
          return () =>
            h("input", { ref: input, "data-name": props.name, style: { width: "120px" } });
        },
      });
      const page = html`<section>
        ${many(
          items,
          (name) => name,
          (_, name) => view(Field, { name }, { id: `vue-keyed-${name}` }),
        )}
      </section>`;
      yield* render(page, document.body).pipe(Fx.provide(DomRenderTemplate), Fx.take(1), Fx.drain);
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
