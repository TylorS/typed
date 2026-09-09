import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import * as AD from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Subject from "@typed/fx/Subject";
import { TestRouter } from "@typed/router/RouterTest";
import { Cause, Context, Effect, Exit, Layer, ManagedRuntime, Stream } from "effect";
import { hydrate, mount, unmount } from "svelte";
import { get, writable, type Writable } from "svelte/store";
import type { Runtime } from "../Runtime.js";
import type { RefSubjectStore } from "../Reactive.js";
import type { Source } from "../Source.js";
import CapabilitiesResource from "./fixtures/CapabilitiesResource.svelte";
import CapabilitiesRouter from "./fixtures/CapabilitiesRouter.svelte";
import CapabilitiesRef from "./fixtures/CapabilitiesRef.svelte";
import { Greeting } from "./fixtures/capabilities.js";

const targets: HTMLElement[] = [];
class Counter extends Context.Service<Counter, RefSubject.RefSubject<number>>()(
  "svelte-test/Counter",
) {}
class FailingCounter extends Context.Service<
  FailingCounter,
  RefSubject.RefSubject<number, string>
>()("svelte-test/FailingCounter") {}
const target = () => {
  const element = document.createElement("div");
  document.body.append(element);
  targets.push(element);
  return element;
};
const text = (element: HTMLElement, selector: string) =>
  element.querySelector(selector)?.textContent;
afterEach(() => {
  for (const element of targets.splice(0)) element.remove();
});

describe("Svelte ecosystem lifecycle", () => {
  it("synchronously represents an unresolved ref and starts its initializer only after mount", async () => {
    const element = target();
    const gate = Promise.withResolvers<number>();
    let started = 0;
    const runtime = ManagedRuntime.make(
      Layer.effect(
        Counter,
        RefSubject.make(
          Effect.promise(() => {
            started++;
            return gate.promise;
          }),
        ),
      ),
    );
    const ref = await runtime.runPromise(Counter);
    const snapshots: Array<unknown> = [];
    const instance = mount(CapabilitiesRef, {
      target: element,
      props: {
        runtime,
        ref,
        capture: (store: RefSubjectStore<number, never>) => {
          store.subscribe((value) => snapshots.push(value))();
          expect(get(store.state.data)._tag).toBe("NoData");
          expect(started).toBe(0);
        },
      },
    });
    try {
      await expect.poll(() => started).toBe(1);
      expect(snapshots).toEqual([undefined]);
      gate.resolve(8);
      await expect.poll(() => text(element, "[data-ref]")).toBe("8");
      expect(text(element, "[data-ref-state]")).toBe("Success");
    } finally {
      gate.resolve(8);
      await unmount(instance);
      await runtime.dispose();
    }
  });

  it("hydrates a ref snapshot in place before resolving a lazy client value", async () => {
    const element = target();
    element.innerHTML = (await commands.renderSvelteFixture("ref", "4")).html;
    const serverNode = element.querySelector("[data-ref]");
    const gate = Promise.withResolvers<number>();
    const runtime = ManagedRuntime.make(
      Layer.effect(Counter, RefSubject.make(Effect.promise(() => gate.promise))),
    );
    const ref = await runtime.runPromise(Counter);
    const warnings = vi.spyOn(console, "warn");
    const instance = hydrate(CapabilitiesRef, {
      target: element,
      props: {
        runtime,
        ref,
        options: { initial: 4 },
      },
    });
    try {
      expect(serverNode?.textContent).toBe("4");
      gate.resolve(5);
      await expect.poll(() => text(element, "[data-ref]")).toBe("5");
      expect(element.querySelector("[data-ref]")).toBe(serverNode);
      expect(warnings.mock.calls.flat().join("\n")).not.toContain("hydration");
    } finally {
      gate.resolve(5);
      await unmount(instance);
      await runtime.dispose();
      warnings.mockRestore();
    }
  });

  it("waits for transitive source cleanup when a queued runtime is cancelled", async () => {
    const element = target();
    const gate = Promise.withResolvers<void>();
    const events: string[] = [];
    const updates = Subject.unsafeMake<string>();
    const first = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "A" }));
    const queued = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "B" }));
    const last = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "C" }));
    const runtimes = writable<Runtime<Greeting>>(first);
    const source = Fx.unwrap(
      Effect.gen(function* () {
        const service = yield* Greeting;
        yield* Effect.acquireRelease(
          Effect.sync(() => {
            events.push(`acquire:${service.prefix}`);
          }),
          () =>
            Effect.gen(function* () {
              events.push(`release:${service.prefix}:start`);
              if (service.prefix === "A") yield* Effect.promise(() => gate.promise);
              events.push(`release:${service.prefix}:end`);
            }),
        );
        return Fx.succeed(service.prefix).pipe(
          Fx.concat(Fx.map(updates, (suffix) => service.prefix + suffix)),
        );
      }),
    );
    const instance = mount(CapabilitiesResource, {
      target: element,
      props: { runtime: runtimes, source },
    });
    try {
      await expect.poll(() => text(element, "[data-value]")).toBe("A");
      runtimes.set(queued);
      await expect.poll(() => events).toContain("release:A:start");
      runtimes.set(last);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      expect(events).toEqual(["acquire:A", "release:A:start"]);
      expect(events).not.toContain("acquire:B");
      expect(text(element, "[data-value]")).toBe("A");
      gate.resolve();
      await expect.poll(() => text(element, "[data-value]")).toBe("C");
      expect(events).toEqual(["acquire:A", "release:A:start", "release:A:end", "acquire:C"]);
      await Effect.runPromise(updates.onSuccess(" updated"));
      await expect.poll(() => text(element, "[data-value]")).toBe("C updated");
    } finally {
      gate.resolve();
      await unmount(instance);
      await first.dispose();
      await queued.dispose();
      await last.dispose();
    }
  });

  it("exposes failing RefSubject reads and writes, recovers, and preserves concurrent transactions", async () => {
    const element = target();
    const runtime = ManagedRuntime.make(
      Layer.effect(FailingCounter, RefSubject.make<number, string>(Effect.fail("read failed"))),
    );
    const ref = await runtime.runPromise(FailingCounter);
    let store!: RefSubjectStore<number, string>;
    const instance = mount(CapabilitiesRef, {
      target: element,
      props: {
        runtime,
        ref,
        capture: (value: RefSubjectStore<number, string>) => {
          store = value;
        },
      },
    });
    try {
      await expect.poll(() => text(element, "[data-ref-error]")).toBe("read failed");
      const failed = await store.update((value) => value + 1);
      expect(Exit.isFailure(failed)).toBe(true);
      expect(text(element, "[data-ref-state]")).toBe("Failure");
      const recovered = await store.set(2);
      expect(recovered).toEqual(Exit.succeed(2));
      await expect.poll(() => text(element, "[data-ref-state]")).toBe("Success");
      await Promise.all(Array.from({ length: 10 }, () => store.update((value) => value + 1)));
      expect(await runtime.runPromise(ref)).toBe(12);
      await expect.poll(() => text(element, "[data-ref]")).toBe("12");
      // Native bindings may ignore write results; the failure is still observable.
      void store.update(() => {
        throw new Error("bad edit");
      });
      await expect.poll(() => text(element, "[data-ref-state]")).toBe("Failure");
      expect(await runtime.runPromise(ref)).toBe(12);
    } finally {
      await unmount(instance);
      expect(Exit.isFailure(await store.set(99))).toBe(true);
      expect(await runtime.runPromise(ref)).toBe(12);
      await runtime.dispose();
    }
  });

  it("interrupts queued RefSubject writes on runtime replacement and unmount", async () => {
    const element = target();
    const runtime = ManagedRuntime.make(Layer.effect(Counter, RefSubject.make(0)));
    const ref = await runtime.runPromise(Counter);
    const gate = Promise.withResolvers<void>();
    let writes = 0;
    let pause = false;
    const slow: Runtime<Counter> = {
      ...runtime,
      runPromiseExit: (effect, options) =>
        runtime.runPromiseExit(
          pause
            ? Effect.promise(() => {
                writes++;
                return gate.promise;
              }).pipe(Effect.andThen(effect))
            : effect,
          options,
        ),
    };
    const runtimes = writable<Runtime<Counter>>(slow);
    let store!: RefSubjectStore<number, never>;
    const instance = mount(CapabilitiesRef, {
      target: element,
      props: {
        runtime: runtimes,
        ref,
        capture: (value: RefSubjectStore<number, never>) => {
          store = value;
        },
      },
    });
    await expect.poll(() => text(element, "[data-ref]")).toBe("0");
    pause = true;
    const pending = store.update((value) => value + 1);
    await expect.poll(() => writes).toBe(1);
    runtimes.set(runtime);
    expect(Exit.isFailure(await pending)).toBe(true);
    gate.resolve();
    await store.update((value) => value + 1);
    expect(await runtime.runPromise(ref)).toBe(1);
    const gate2 = Promise.withResolvers<void>();
    let pauseAgain = false;
    const slowAgain: Runtime<Counter> = {
      ...runtime,
      runPromiseExit: (effect, options) =>
        runtime.runPromiseExit(
          pauseAgain
            ? Effect.promise(() => {
                writes++;
                return gate2.promise;
              }).pipe(Effect.andThen(effect))
            : effect,
          options,
        ),
    };
    runtimes.set(slowAgain);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    pauseAgain = true;
    const stopped = store.set(99);
    await expect.poll(() => writes).toBe(2);
    await unmount(instance);
    expect(Exit.isFailure(await stopped)).toBe(true);
    gate2.resolve();
    expect(await runtime.runPromise(ref)).toBe(1);
    await runtime.dispose();
  });

  it("hydrates the prefetched server snapshot in place before starting client work", async () => {
    const element = target();
    element.innerHTML = (await commands.renderSvelteFixture("capabilities", "snapshot")).html;
    const serverNode = element.querySelector("[data-value]");
    const runtime = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "client" }));
    let runs = 0;
    const source = Effect.sync(() => {
      runs++;
      return "client";
    });
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const instance = hydrate(CapabilitiesResource, {
      target: element,
      props: { runtime, source, initial: AD.success("snapshot") },
    });
    try {
      expect(element.querySelector("[data-value]")).toBe(serverNode);
      await expect.poll(() => text(element, "[data-value]")).toBe("client");
      expect(runs).toBe(1);
      expect(element.querySelector("[data-value]")).toBe(serverNode);
      expect(warnings.mock.calls.flat().join(" ")).not.toContain("hydration");
      expect(errors.mock.calls.flat().join(" ")).not.toContain("hydration");
    } finally {
      warnings.mockRestore();
      errors.mockRestore();
      await unmount(instance);
      await runtime.dispose();
    }
  });

  it("flattens AsyncData loading, refreshing, optimistic and failed emissions", async () => {
    const element = target();
    const runtime = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "app" }));
    const source = writable<AD.AsyncData<string, string>>(AD.loading());
    const instance = mount(CapabilitiesResource, {
      target: element,
      props: { runtime, source, asyncData: true, initial: AD.NoData },
    });
    try {
      await expect.poll(() => text(element, "[data-state]")).toBe("Loading");
      source.set(AD.success("loaded"));
      await expect.poll(() => text(element, "[data-value]")).toBe("loaded");
      source.set(AD.startLoading(AD.success("loaded")));
      await expect.poll(() => text(element, "[data-refreshing]")).toBe("true");
      expect(text(element, "[data-value]")).toBe("loaded");
      source.set(AD.optimistic(AD.success("loaded"), "draft"));
      await expect.poll(() => text(element, "[data-value]")).toBe("draft");
      source.set(AD.failure(Cause.fail("offline")));
      await expect.poll(() => text(element, "[data-state]")).toBe("Failure");
      expect(text(element, "[data-latest]")).toBe("draft");
      expect(text(element, "[data-pending]")).toBe("false");
    } finally {
      await unmount(instance);
      await runtime.dispose();
    }
  });

  it("replaces sources and runtime services, refreshes, reports failures and cancels scoped work", async () => {
    const element = target();
    const one = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "one" }));
    const two = ManagedRuntime.make(Layer.succeed(Greeting, { prefix: "two" }));
    const runtimes = writable<Runtime<Greeting>>(one);
    let releases = 0;
    let acquisitions = 0;
    const active = Fx.unwrap(
      Effect.gen(function* () {
        yield* Effect.acquireRelease(
          Effect.sync(() => {
            acquisitions++;
          }),
          () =>
            Effect.sync(() => {
              releases++;
            }),
        );
        const greeting = yield* Greeting;
        return Fx.succeed(greeting.prefix);
      }),
    );
    const sources =
      writable<Source<string, string, Greeting | import("effect/Scope").Scope>>(active);
    const instance = mount(CapabilitiesResource, {
      target: element,
      props: { runtime: runtimes, source: sources },
    });
    try {
      await expect.poll(() => text(element, "[data-value]")).toBe("one");
      expect(acquisitions).toBe(1);
      runtimes.set(two);
      await expect.poll(() => text(element, "[data-value]")).toBe("two");
      await expect.poll(() => releases).toBe(1);
      await expect.poll(() => text(element, "[data-service]")).toBe("two");
      sources.set(Effect.fail("offline"));
      await expect.poll(() => text(element, "[data-state]")).toBe("Failure");
      expect(text(element, "[data-latest]")).toBe("two");
      await expect.poll(() => releases).toBe(2);
      sources.set(Stream.make("stream-first", "stream-final"));
      await expect.poll(() => text(element, "[data-value]")).toBe("stream-final");
      sources.set(Effect.never);
      await expect.poll(() => text(element, "[data-refreshing]")).toBe("true");
      element.querySelector<HTMLButtonElement>("[data-cancel]")!.click();
      await expect.poll(() => text(element, "[data-pending]")).toBe("false");
      sources.set(active);
      await expect.poll(() => acquisitions).toBe(3);
      element.querySelector<HTMLButtonElement>("[data-refresh]")!.click();
      await expect.poll(() => acquisitions).toBe(4);
      await expect.poll(() => releases).toBe(3);
      sources.set(Fx.empty);
      await expect.poll(() => releases).toBe(4);
      await expect.poll(() => text(element, "[data-pending]")).toBe("false");
    } finally {
      await unmount(instance);
      await expect.poll(() => releases).toBe(acquisitions);
      expect(await two.runPromise(Effect.succeed(42))).toBe(42);
      await one.dispose();
      await two.dispose();
    }
  });

  it("reacts to navigation and route params while nested Typed inherits service overrides and CurrentRoute", async () => {
    const element = target();
    const runtime = ManagedRuntime.make(
      Layer.merge(
        TestRouter({ url: "https://example.test/app/users/1" }),
        Layer.succeed(Greeting, { prefix: "parent" }),
      ),
    );
    const overrides = writable(Context.make(Greeting, { prefix: "child" }));
    const instance = mount(CapabilitiesRouter, { target: element, props: { runtime, overrides } });
    try {
      await expect.poll(() => text(element, "[data-path]")).toBe("/app/users/1");
      await expect.poll(() => text(element, "[data-params]")).toBe("1");
      await expect.poll(() => text(element, "[data-context]")).toBe("child:/app:/");
      expect(text(element, "[data-route]")).toBe("/app");
      await expect.poll(() => text(element, "[data-transition]")).toBe("idle");
      overrides.set(Context.make(Greeting, { prefix: "updated" }));
      await expect.poll(() => text(element, "[data-context]")).toBe("updated:/app:/");
      element.querySelector<HTMLButtonElement>("[data-next]")!.click();
      await expect.poll(() => text(element, "[data-params]")).toBe("2");
      expect(text(element, "[data-path]")).toBe("/app/users/2");
      element.querySelector<HTMLButtonElement>("[data-away]")!.click();
      await expect.poll(() => text(element, "[data-params]")).toBe("unmatched");
      element.querySelector<HTMLButtonElement>("[data-back]")!.click();
      await expect.poll(() => text(element, "[data-params]")).toBe("2");
      expect((await runtime.runPromise(Greeting)).prefix).toBe("parent");
    } finally {
      await unmount(instance);
      await runtime.dispose();
    }
  });

  it("keeps native writable state and RefSubject synchronized and ignores writes after unmount", async () => {
    const element = target();
    const runtime = ManagedRuntime.make(Layer.effect(Counter, RefSubject.make(0)));
    const ref = await runtime.runPromise(Counter);
    let store: Writable<number> | undefined;
    const instance = mount(CapabilitiesRef, {
      target: element,
      props: {
        runtime,
        ref,
        capture: (s: Writable<number>) => {
          store = s;
        },
      },
    });
    await expect.poll(() => text(element, "[data-ref]")).toBe("0");
    element.querySelector<HTMLButtonElement>("[data-increment]")!.click();
    await expect.poll(() => text(element, "[data-ref]")).toBe("1");
    await expect.poll(() => runtime.runPromise(ref)).toBe(1);
    await runtime.runPromise(RefSubject.set(ref, 2));
    await expect.poll(() => text(element, "[data-ref]")).toBe("2");
    await unmount(instance);
    await expect
      .poll(() => {
        store!.set(99);
        return runtime.runPromise(ref);
      })
      .toBe(2);
    await runtime.dispose();
  });
});
