import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import { Fx, RefSubject, Subject } from "@typed/fx";
import { expect, it } from "vitest";
import { DomRenderTemplate, many, render } from "../src/index.js";
import { DomRenderEvent } from "../src/RenderEvent.js";

// Run separately from correctness tests:
// pnpm --filter @typed/template exec vitest run --config benchmarks/vitest.config.ts
// Raw DOM output isolates list reconciliation from template parsing and frame scheduling.
for (const source of ["RefSubject", "Subject"] as const) {
  for (const size of [1_000, 5_000]) {
    it(`many: ${size} single-node entries (${source})`, async ({ annotate }) => {
      const samples: Array<Record<string, number>> = [];
      for (let sample = 0; sample < 6; sample++) {
        const result = await Effect.gen(function* () {
          const host = document.createElement("div");
          document.body.append(host);
          yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
          const values = Array.from({ length: size }, (_, id) => ({ id, value: 0 }));
          const ref = yield* RefSubject.make(values);
          const subject = yield* Subject.make<typeof values>(1);
          yield* subject.onSuccess(values);
          const items = source === "RefSubject" ? ref : subject;
          const publish = (next: typeof values) =>
            source === "RefSubject" ? RefSubject.set(ref, next) : subject.onSuccess(next);
          const childRefs = new Map<number, RefSubject.RefSubject<{ id: number; value: number }>>();
          const mounted = yield* Deferred.make<void>();
          const list = many(
            items,
            (_) => _.id,
            (ref, key) => {
              childRefs.set(key, ref);
              return Fx.map(ref, ({ value }) => {
                const node = document.createElement("span");
                node.dataset["key"] = String(key);
                node.textContent = String(value);
                return DomRenderEvent(node);
              });
            },
          );
          const start = performance.now();
          yield* render(list, host).pipe(
            Fx.provide(DomRenderTemplate.using(document)),
            Fx.observe(() => Deferred.succeed(mounted, undefined)),
            Effect.forkScoped,
          );
          yield* Deferred.await(mounted);
          const mount = performance.now() - start;
          expect(host.children.length).toBe(size);
          const original = Array.from(host.children);

          let ordered = values;
          const rotateStart = performance.now();
          for (let i = 0; i < 50; i++) {
            ordered = [ordered[ordered.length - 1], ...ordered.slice(0, -1)];
            yield* publish(ordered);
          }
          const rotate = performance.now() - rotateStart;
          expect(host.firstElementChild).toBe(original[size - 50]);

          const updateStart = performance.now();
          for (let i = 1; i <= 50; i++) {
            yield* RefSubject.set(childRefs.get(0)!, { id: 0, value: i });
          }
          const update = performance.now() - updateStart;
          expect(host.querySelector('[data-key="0"]')?.textContent).toBe("50");

          const reverseStart = performance.now();
          for (let i = 0; i < 10; i++) {
            ordered = [...ordered].reverse();
            yield* publish(ordered);
          }
          const reverse = performance.now() - reverseStart;
          expect(host.firstElementChild).toBe(original[size - 50]);
          return { mount, rotate, update, reverse };
        }).pipe(Effect.scoped, Effect.runPromise);
        if (sample > 0) samples.push(result);
      }
      const medians = Object.fromEntries(
        Object.keys(samples[0]).map((name) => {
          const sorted = samples.map((sample) => sample[name]).sort((a, b) => a - b);
          return [name, Number(sorted[Math.floor(sorted.length / 2)].toFixed(2))];
        }),
      );
      await annotate(
        JSON.stringify({
          source,
          size,
          iterations: { rotate: 50, update: 50, reverse: 10 },
          medianMs: medians,
          samples,
        }),
        "benchmark",
      );
    });
  }
}
