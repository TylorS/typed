import { describe, expect, it } from "vitest";
import { Effect, Fiber } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { get, readable, writable } from "svelte/store";
import { fromReadable, toReadable, toWritable } from "../Store.js";

const waitFor = (assertion: () => void) =>
  Effect.promise(() => import("vitest").then(({ vi }) => vi.waitFor(assertion)));

describe("Svelte stores", () => {
  it("observes a non-failing Fx until the enclosing Scope closes", async () => {
    let closed = 0;
    await Effect.gen(function* () {
      const source = yield* RefSubject.make(0);
      const values = Fx.unwrap(
        Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            closed++;
          }),
        ).pipe(Effect.as(source)),
      );
      const store = yield* toReadable(values, -1);
      expect(get(store)).toBe(-1);
      yield* waitFor(() => expect(get(store)).toBe(0));
      yield* RefSubject.set(source, 1);
      yield* waitFor(() => expect(get(store)).toBe(1));
      expect(closed).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(closed).toBe(1);
  });

  it("synchronizes RefSubject writes, preserves rapid updates, and stops writes after cleanup", async () => {
    const store = await Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const store = yield* toWritable(ref);
      yield* waitFor(() => expect(get(store)).toBe(0));
      store.set(1);
      store.update((n) => n + 1);
      store.update((n) => n + 1);
      expect(get(store)).toBe(3);
      yield* waitFor(() => expect(get(store)).toBe(3));
      const runPromise = Effect.runPromiseWith(yield* Effect.context());
      yield* Effect.promise(async () => {
        await expect.poll(() => runPromise(ref)).toBe(3);
      });
      yield* RefSubject.set(ref, 4);
      yield* waitFor(() => expect(get(store)).toBe(4));
      return store;
    }).pipe(Effect.scoped, Effect.runPromise);
    store.set(10);
    store.update(() => 100);
    expect(get(store)).toBe(4);
  });

  it("converts a Svelte readable to Fx with synchronous initial value and interruption cleanup", async () => {
    let active = 0;
    const input = writable(0);
    const store = readable(0, (set) => {
      active++;
      const stop = input.subscribe(set);
      return () => {
        active--;
        stop();
      };
    });
    const values: Array<number> = [];
    const fiber = Effect.runFork(
      Fx.observe(fromReadable(store), (value) => {
        values.push(value);
      }),
    );
    try {
      await expect.poll(() => values).toEqual([0]);
      input.set(1);
      await expect.poll(() => values).toEqual([0, 1]);
      expect(active).toBe(1);
    } finally {
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
    expect(active).toBe(0);
  });
});
