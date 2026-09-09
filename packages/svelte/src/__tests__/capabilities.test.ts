import { describe, expect, it } from "vitest";
import * as AD from "@typed/async-data";
import { Cause, Context, Effect, Layer, ManagedRuntime, Option } from "effect";
import { get, writable } from "svelte/store";
import { render } from "svelte/server";
import { asyncState } from "../AsyncData.js";
import { prefetch } from "../Reactive.js";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import CapabilitiesRef from "./fixtures/CapabilitiesRef.svelte";
import { CurrentPath } from "@typed/navigation/Navigation";
import { ServerRouter } from "@typed/router/Router";
import { TestRouter } from "@typed/router/RouterTest";
import { fromContext, withServices } from "../Runtime.js";
import CapabilitiesResource from "./fixtures/CapabilitiesResource.svelte";
import { Greeting } from "./fixtures/capabilities.js";

describe("Svelte ecosystem state", () => {
  it("starts with NoData until observation even when the ref has a value", async () => {
    await Effect.gen(function* () {
      const ref = yield* RefSubject.make(7);
      const values: unknown[] = [];
      const output = render(CapabilitiesRef, {
        props: {
          ref,
          capture: (store: { subscribe: (f: (value: unknown) => void) => () => void }) =>
            store.subscribe((value) => values.push(value))(),
        },
      });
      expect(output.body).toContain('data-ref=""></p>');
      expect(output.body).toContain('data-ref-state="">NoData</p>');
      expect(values).toEqual([undefined]);
      yield* RefSubject.set(ref, 9);
      expect(render(CapabilitiesRef, { props: { ref } }).body).toContain('data-ref=""></p>');
      expect(render(CapabilitiesRef, { props: { ref, options: { initial: 3 } } }).body).toContain(
        'data-ref="">3</p>',
      );
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("leaves lazy refs uninitialized on the server and honors an explicit hydration snapshot", async () => {
    let started = 0;
    await Effect.gen(function* () {
      const ref = yield* RefSubject.make(
        Effect.sync(() => {
          started++;
          return 10;
        }),
      );
      const output = render(CapabilitiesRef, { props: { ref } });
      expect(output.body).toContain('data-ref=""></p>');
      expect(output.body).toContain('data-ref-state="">NoData</p>');
      const explicit = render(CapabilitiesRef, { props: { ref, options: { initial: 4 } } });
      expect(explicit.body).toContain('data-ref="">4</p>');
      expect(explicit.body).toContain('data-ref-state="">Success</p>');
      expect(started).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("leaves retained RefSubject failures to normal observation", async () => {
    await Effect.gen(function* () {
      const ref = yield* RefSubject.make<number, string>(Effect.fail("read failed"));
      yield* Effect.exit(ref);
      const output = render(CapabilitiesRef, { props: { ref } });
      expect(output.body).toContain('data-ref-state="">NoData</p>');
      expect(output.body).toContain('data-ref-error="">none</p>');
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("honors an explicit undefined snapshot over retained values and failures", async () => {
    await Effect.gen(function* () {
      const retained = yield* RefSubject.make<string | undefined>("old");
      const failed = yield* RefSubject.make<string | undefined, string>(Effect.fail("offline"));
      yield* Effect.exit(failed);
      for (const ref of [retained, failed]) {
        const output = render(CapabilitiesRef, { props: { ref, options: { initial: undefined } } });
        expect(output.body).toContain('data-ref=""></p>');
        expect(output.body).toContain('data-ref-state="">Success</p>');
        expect(output.body).toContain('data-ref-error="">none</p>');
      }
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("borrows context and shadows services without acquiring or disposing its parent", async () => {
    const runtime = fromContext(Context.make(Greeting, { prefix: "parent" }));
    const child = withServices(runtime, Context.make(Greeting, { prefix: "child" }));
    expect(child.runSync(Greeting).prefix).toBe("child");
    expect(await child.runPromise(Effect.map(Greeting, (s) => s.prefix))).toBe("child");
    expect(runtime.runSync(Greeting).prefix).toBe("parent");
  });

  it("derives loading, refreshing, optimistic, failure and retained latest values", () => {
    const data = writable<AD.AsyncData<string, string>>(AD.NoData);
    const state = asyncState(data);
    const unsubscribe = state.latest.subscribe(() => {});
    expect(get(state.pending)).toBe(false);
    data.set(AD.loading());
    expect(get(state.loading)).toBe(true);
    data.set(AD.success("first"));
    data.update(AD.startLoading);
    expect(get(state.refreshing)).toBe(true);
    expect(get(state.value)).toEqual(Option.some("first"));
    data.set(AD.optimistic(AD.success("first"), "draft"));
    expect(get(state.optimistic)).toBe(true);
    expect(get(state.value)).toEqual(Option.some("draft"));
    data.set(AD.failure(Cause.fail("offline")));
    expect(get(state.failure)).toBe(true);
    expect(get(state.error)).toEqual(Option.some("offline"));
    expect(get(state.value)).toEqual(Option.none());
    expect(get(state.latest)).toEqual(Option.some("draft"));
    unsubscribe();
  });

  it("renders only deterministic snapshots on the server without acquiring runtime or source", async () => {
    let acquired = 0;
    let started = 0;
    const runtime = ManagedRuntime.make(
      Layer.effect(
        Greeting,
        Effect.sync(() => {
          acquired++;
          return { prefix: "live" };
        }),
      ),
    );
    const source = Effect.sync(() => {
      started++;
      return "live";
    });
    try {
      const output = render(CapabilitiesResource, { props: { runtime, source } });
      expect(output.body).toContain("server-service");
      expect(output.body).toContain('data-value="">server</p>');
      expect(output.body).toContain('data-pending="">false</p>');
      expect(acquired).toBe(0);
      expect(started).toBe(0);
    } finally {
      await runtime.dispose();
    }
  });

  it("prefetches a scoped first snapshot for SSR and preserves source failure causes", async () => {
    let releases = 0;
    const runtime = fromContext(Context.make(Greeting, { prefix: "prefetched" }));
    const source = Fx.unwrap(
      Effect.gen(function* () {
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            releases++;
          }),
        );
        const service = yield* Greeting;
        return Fx.succeed(service.prefix);
      }),
    );
    const initial = await runtime.runPromise(prefetch(source));
    expect(initial).toEqual(AD.success("prefetched"));
    expect(releases).toBe(1);
    const output = render(CapabilitiesResource, { props: { runtime, source, initial } });
    expect(output.body).toContain('data-value="">prefetched</p>');
    expect(releases).toBe(1);
    expect(await Effect.runPromise(prefetch(Fx.empty))).toEqual(AD.NoData);
    const failed = await Effect.runPromise(prefetch(Effect.fail("prefetch failed")));
    expect(AD.getError(failed)).toEqual(Option.some("prefetch failed"));
  });

  it("prefetches the same navigation source using server and deterministic test providers", async () => {
    for (const layer of [
      ServerRouter({ url: "https://example.test/users/1?tab=all" }),
      TestRouter({ url: "https://example.test/users/1?tab=all" }),
    ]) {
      const snapshot = await Effect.runPromise(prefetch(CurrentPath).pipe(Effect.provide(layer)));
      expect(snapshot).toEqual(AD.success("/users/1?tab=all"));
    }
  });
});
