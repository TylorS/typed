import * as RefSubject from "@typed/fx/RefSubject";
import { Navigation } from "@typed/navigation/Navigation";
import { TestRouter } from "@typed/router/RouterTest";
import * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { describe, expect, it } from "vitest";
import { effectScope, shallowRef } from "vue";
import { useEffect, useRefSubject } from "../Reactive.js";
import { useNavigation } from "../Router.js";
import { fromContext } from "../Runtime.js";

describe("native Vue scope ownership", () => {
  it("skips superseded sources while asynchronous finalization is pending", async () => {
    let finishCleanup!: () => void;
    let cleaning = false;
    const started: string[] = [];
    const source = shallowRef<Effect.Effect<string>>(
      Effect.acquireUseRelease(
        Effect.sync(() => {
          started.push("first");
        }),
        () => Effect.never,
        () =>
          Effect.promise(() => {
            cleaning = true;
            return new Promise<void>((resolve) => {
              finishCleanup = resolve;
            });
          }),
      ),
    );
    const scope = effectScope();
    const state = scope.run(() => useEffect(source))!;
    await expect.poll(() => started).toEqual(["first"]);
    source.value = Effect.sync(() => {
      started.push("obsolete");
      return "obsolete";
    });
    await expect.poll(() => cleaning).toBe(true);
    source.value = Effect.sync(() => {
      started.push("latest");
      return "latest";
    });
    finishCleanup();
    await expect.poll(() => state.success.value).toBe(true);
    expect(started).toEqual(["first", "latest"]);
    scope.stop();
  });

  it.each(["runtime", "subject", "dispose"] as const)(
    "cancels concurrent writes on %s replacement",
    async (mode) => {
      const runtimes = [ManagedRuntime.make(Layer.empty), ManagedRuntime.make(Layer.empty)];
      try {
        await Effect.gen(function* () {
          const initial = yield* RefSubject.make(0);
          const next = yield* RefSubject.make(10);
          const subject = shallowRef(initial);
          const runtime = shallowRef(runtimes[0]!);
          const acquired = yield* Deferred.make<void>();
          const lock = yield* RefSubject.runUpdates(initial, () =>
            Deferred.succeed(acquired, undefined).pipe(Effect.andThen(Effect.never)),
          ).pipe(Effect.forkScoped);
          yield* Deferred.await(acquired);
          const scope = effectScope();
          const state = scope.run(() => useRefSubject(subject, { runtime, immediate: false }))!;
          const writes = [state.set(1), state.update((n) => n + 1)];
          if (mode === "runtime") runtime.value = runtimes[1]!;
          else if (mode === "subject") subject.value = next;
          else scope.stop();
          const exits = yield* Effect.promise(() => Promise.all(writes));
          expect(exits.every(Exit.isFailure)).toBe(true);
          yield* Fiber.interrupt(lock);
          expect(yield* initial).toBe(0);
          if (mode !== "dispose") {
            expect(yield* Effect.promise(() => state.set(7))).toEqual(Exit.succeed(7));
            expect(yield* subject.value).toBe(7);
          }
          scope.stop();
          expect(Exit.isFailure(yield* Effect.promise(() => state.set(99)))).toBe(true);
          expect(yield* subject.value).toBe(mode === "dispose" ? 0 : 7);
        }).pipe(Effect.scoped, Effect.runPromise);
      } finally {
        await Promise.all(runtimes.map((runtime) => runtime.dispose()));
      }
    },
  );

  it.each(["runtime", "dispose"] as const)(
    "cancels concurrent navigation on %s replacement",
    async (mode) => {
      const owner = ManagedRuntime.make(TestRouter({ url: "https://example.com/start" }));
      try {
        const service = await owner.runPromise(Navigation);
        let acquired = 0;
        let released = 0;
        const runtime = shallowRef(
          fromContext(
            Context.make(Navigation, {
              ...service,
              navigate: () =>
                Effect.acquireUseRelease(
                  Effect.sync(() => {
                    acquired++;
                  }),
                  () => Effect.never,
                  () =>
                    Effect.sync(() => {
                      released++;
                    }),
                ),
            }),
          ),
        );
        const scope = effectScope();
        const navigation = scope.run(() => useNavigation({ runtime }))!;
        const actions = [navigation.navigate("/one"), navigation.navigate("/two")];
        await expect.poll(() => acquired).toBe(2);
        if (mode === "runtime") runtime.value = fromContext(Context.make(Navigation, service));
        else scope.stop();
        expect((await Promise.all(actions)).every(Exit.isFailure)).toBe(true);
        expect(released).toBe(2);
        if (mode === "runtime")
          expect(Exit.isSuccess(await navigation.navigate("/next"))).toBe(true);
        scope.stop();
        expect(Exit.isFailure(await navigation.navigate("/after-disposal"))).toBe(true);
        const current = await owner.runPromise(Navigation.currentEntry);
        expect(current.url.pathname).toBe(mode === "runtime" ? "/next" : "/start");
      } finally {
        await owner.dispose();
      }
    },
  );
});
