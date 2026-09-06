import { Deferred, Effect, Option } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { describe, expect, it, vi } from "vitest";
import {
  DomRenderTemplate,
  html,
  HtmlRenderTemplate,
  render,
  renderToHtmlString,
} from "../../index.js";

export function sparseClassTests(createDocument: () => Document) {
  describe("sparse class concatenation", () => {
    const collections = [
      ["array", ["one", "two"]],
      ["nested array", ["one", ["two", "three"]]],
      ["effect array", Effect.succeed(["one", ["two", "three"]])],
      ["Fx array", Fx.succeed(["one", ["two", "three"]])],
      ["optional array", ["one", Option.none(), [null, "two", undefined, Option.some("three")]]],
    ] as const;
    for (const [name, value] of collections) {
      for (const sparse of [false, true]) {
        it(`preserves ${name} entries in ${sparse ? "sparse" : "whole"} classes across SSR and DOM`, () =>
          Effect.gen(function* () {
            const document = createDocument();
            const view = sparse
              ? html`<div class="base ${value}"></div>`
              : html`<div class=${value}></div>`;
            const expected = [
              ...(sparse ? ["base"] : []),
              "one",
              "two",
              ...(name === "array" ? [] : ["three"]),
            ];
            const serialized = yield* view.pipe(
              renderToHtmlString,
              Effect.provide(HtmlRenderTemplate),
            );
            expect(serialized.match(/class=/g)).toHaveLength(1);
            for (const hydrate of [false, true]) {
              const host = document.createElement("main");
              if (hydrate) {
                host.innerHTML = serialized;
                expect(Array.from(host.querySelector("div")!.classList)).toEqual(expected);
              }
              yield* render(view, host).pipe(
                Fx.provide(DomRenderTemplate.using(document)),
                Fx.take(1),
                Fx.drain,
              );
              expect(Array.from(host.querySelector("div")!.classList)).toEqual(expected);
            }
          }).pipe(Effect.scoped, Effect.runPromise));
      }
    }
    for (const hydrate of [false, true]) {
      it(`joins authored segments before splitting tokens during ${hydrate ? "hydration" : "DOM rendering"} and updates`, () =>
        Effect.gen(function* () {
          const document = createDocument();
          const host = document.createElement("main");
          document.body.append(host);
          yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
          const kind = yield* RefSubject.make<string | ReadonlyArray<string>>("input");
          const phase = yield* RefSubject.make("ready");
          const view = html`<div class="row row--${kind} status-${phase}-end"></div>`;
          const serialized = yield* view.pipe(
            renderToHtmlString,
            Effect.provide(HtmlRenderTemplate),
          );
          const reference = document.createElement("main");
          reference.innerHTML = serialized;
          const expectedInitial = ["row", "row--input", "status-ready-end"];
          expect(Array.from(reference.querySelector("div")!.classList)).toEqual(expectedInitial);
          let original: HTMLDivElement | null = null;
          if (hydrate) {
            host.innerHTML = serialized;
            original = host.querySelector("div")!;
            original.classList.add("external-before-hydration");
          }
          const mounted = yield* Deferred.make<void>();
          yield* render(view, host).pipe(
            Fx.provide(DomRenderTemplate.using(document)),
            Fx.observe(() => Deferred.succeed(mounted, undefined)),
            Effect.forkScoped,
          );
          yield* Deferred.await(mounted);
          const element = host.querySelector("div")!;
          if (hydrate) expect(element).toBe(original);
          const external = hydrate ? ["external-before-hydration"] : [];
          expect(Array.from(element.classList).sort()).toEqual(
            [...expectedInitial, ...external].sort(),
          );
          element.classList.add("external-after-mount");
          yield* RefSubject.set(kind, ["output", "additional"]);
          yield* RefSubject.set(phase, "complete");
          yield* Effect.promise(() =>
            vi.waitFor(() => {
              expect(Array.from(element.classList).sort()).toEqual(
                [
                  "row",
                  "row--output",
                  "additional",
                  "status-complete-end",
                  ...external,
                  "external-after-mount",
                ].sort(),
              );
            }),
          );
          expect(host.querySelector("div")).toBe(element);
        }).pipe(Effect.scoped, Effect.runPromise));
    }
  });
}
