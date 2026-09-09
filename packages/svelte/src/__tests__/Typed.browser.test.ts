import { describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { Cause, Effect, Layer, ManagedRuntime } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import { hydrate, mount, tick, unmount } from "svelte";
import Typed from "@typed/svelte/Typed.svelte";
import { attachment } from "../Attachment.js";
import { writable } from "svelte/store";
import type { AttachmentOptions } from "../Attachment.js";
import TypedOptions from "./fixtures/TypedOptions.svelte";

describe("Typed in Svelte", () => {
  it("updates event policy and callbacks without restarting the render", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const target = document.createElement("div");
    document.body.append(target);
    const failure = Promise.withResolvers<never>();
    let acquired = 0;
    let released = 0;
    let bubbled = 0;
    const oldReady = vi.fn();
    const oldError = vi.fn();
    const newReady = vi.fn();
    const newError = vi.fn();
    const settings = writable<AttachmentOptions<string>>({
      stopPropagation: false,
      onReady: oldReady,
      onError: oldError,
    });
    const source = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(
      Effect.as(
        Fx.merge(
          html`<button>stable</button>`,
          Fx.fromEffect(Effect.tryPromise({ try: () => failure.promise, catch: () => "failed" })),
        ),
      ),
    );
    const click = () => {
      bubbled++;
    };
    document.body.addEventListener("click", click);
    const instance = mount(TypedOptions, { target, props: { runtime, value: source, settings } });
    try {
      await expect.poll(() => oldReady.mock.calls.length).toBe(1);
      const button = target.querySelector("button")!;
      button.click();
      expect(bubbled).toBe(1);
      settings.set({ stopPropagation: { click: true }, onReady: newReady, onError: newError });
      await tick();
      button.click();
      expect(bubbled).toBe(1);
      expect(acquired).toBe(1);
      expect(released).toBe(0);
      expect(target.querySelector("button")).toBe(button);
      expect(newReady).not.toHaveBeenCalled();
      settings.update((current) => ({ ...current, stopPropagation: false }));
      await tick();
      button.click();
      expect(bubbled).toBe(2);
      expect(acquired).toBe(1);
      failure.reject(new Error("failed"));
      await expect.poll(() => newError.mock.calls.length).toBe(1);
      expect(oldError).not.toHaveBeenCalled();
      await expect.poll(() => released).toBe(1);
    } finally {
      await unmount(instance);
      await runtime.dispose();
      document.body.removeEventListener("click", click);
      target.remove();
    }
  });

  it("uses the latest ready callback and default native error reporting", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const target = document.createElement("div");
    const gate = Promise.withResolvers<void>();
    const failure = Promise.withResolvers<never>();
    const oldReady = vi.fn();
    const ready = vi.fn();
    const onError = vi.fn();
    const errors = vi.fn();
    const settings = writable<AttachmentOptions<string>>({ onReady: oldReady, onError });
    const source = Effect.promise(() => gate.promise).pipe(
      Effect.as(
        Fx.merge(
          html`<button>ready</button>`,
          Fx.fromEffect(Effect.tryPromise({ try: () => failure.promise, catch: () => "failed" })),
        ),
      ),
    );
    const instance = mount(TypedOptions, {
      target,
      props: { id: "typed-options", runtime, value: source, settings },
    });
    try {
      await expect.poll(() => target.querySelector("#typed-options")).not.toBeNull();
      target.querySelector("#typed-options")!.addEventListener("typed:error", errors);
      settings.set({ onReady: ready });
      await tick();
      gate.resolve();
      await expect.poll(() => ready.mock.calls.length).toBe(1);
      expect(oldReady).not.toHaveBeenCalled();
      failure.reject(new Error("failed"));
      await expect.poll(() => errors.mock.calls.length).toBe(1);
      expect(onError).not.toHaveBeenCalled();
      expect(
        Cause.hasFails((errors.mock.calls[0][0] as CustomEvent<Cause.Cause<string>>).detail),
      ).toBe(true);
    } finally {
      gate.resolve();
      await unmount(instance);
      await runtime.dispose();
      target.remove();
    }
  });

  it("hydrates actual SSR in an automatic transparent host and updates retained nodes", async () => {
    const fixture = await commands.renderSvelteFixture("inverse", "server");
    const target = document.createElement("div");
    target.innerHTML = fixture.html;
    document.body.append(target);
    const serverNode = target.querySelector<HTMLButtonElement>("[data-typed-counter]");
    const errors = vi.spyOn(console, "warn");
    try {
      await Effect.gen(function* () {
        const label = yield* RefSubject.make("server");
        const typedView = html`<button data-typed-counter>${label}</button>`;
        let ready = false;
        const instance = hydrate(Typed, {
          target,
          props: {
            id: "inverse",
            value: typedView,
            onReady: () => {
              ready = true;
            },
          },
        });
        try {
          yield* Effect.promise(() => expect.poll(() => ready).toBe(true));
          expect(target.querySelector("#inverse")?.getAttribute("style")).toContain(
            "display: contents",
          );
          expect(target.querySelector("[data-typed-counter]")).toBe(serverNode);
          yield* RefSubject.set(label, "client");
          yield* Effect.promise(() => expect.poll(() => serverNode?.textContent).toBe("client"));
          expect(target.querySelector("[data-typed-counter]")).toBe(serverNode);
        } finally {
          yield* Effect.promise(() => unmount(instance));
        }
      }).pipe(Effect.scoped, Effect.runPromise);
      expect(errors.mock.calls.flat().join("\n")).not.toContain("hydration");
    } finally {
      errors.mockRestore();
      target.remove();
    }
  });

  it("keeps a completed source mounted and closes its Scope on unmount", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const runtime = ManagedRuntime.make(Layer.empty);
    let released = 0;
    const source = Fx.fromEffect(
      Effect.acquireRelease(
        Effect.sync(() => {
          const element = document.createElement("button");
          element.textContent = "finite";
          return DomRenderEvent(element);
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const instance = mount(Typed, { target, props: { runtime, value: source } });
    try {
      await expect.poll(() => target.textContent).toBe("finite");
      await tick();
      expect(released).toBe(0);
      await unmount(instance);
      await expect.poll(() => released).toBe(1);
      expect(await runtime.runPromise(Effect.succeed("alive"))).toBe("alive");
    } finally {
      await runtime.dispose();
      target.remove();
    }
  });

  it("reports errors and cancels pending acquisition without disposing the runtime", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const target = document.createElement("div");
    let released = 0;
    let acquired = 0;
    const errors: Array<Cause.Cause<string>> = [];
    try {
      const detach = attachment(runtime, Fx.fail("render failed"), {
        onError: (cause) => errors.push(cause),
      })(target);
      await expect.poll(() => errors.length).toBe(1);
      expect(Cause.hasFails(errors[0])).toBe(true);
      detach?.();
      const stop = attachment(
        runtime,
        Fx.unwrap(
          Effect.acquireRelease(
            Effect.sync(() => {
              acquired++;
            }),
            () =>
              Effect.sync(() => {
                released++;
              }),
          ).pipe(Effect.as(Fx.never)),
        ),
      )(target);
      await expect.poll(() => acquired).toBe(1);
      stop?.();
      await expect.poll(() => released).toBe(1);
      expect(await runtime.runPromise(Effect.succeed(true))).toBe(true);
    } finally {
      await runtime.dispose();
    }
  });
});

describe("attachment replacement serialization", () => {
  it("keeps a canceled middle replacement in the cleanup chain", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    await runtime.runPromise(Effect.void);
    const target = document.createElement("div");
    const gate = Promise.withResolvers<void>();
    const cleanupStarted = Promise.withResolvers<void>();
    let acquiredSecond = 0;
    let acquiredThird = 0;
    let released = 0;
    const first = Effect.acquireRelease(Effect.void, () =>
      Effect.promise(async () => {
        cleanupStarted.resolve();
        await gate.promise;
        released++;
      }),
    ).pipe(Effect.as(html`<p>first</p>`));
    const second = Effect.sync(() => {
      acquiredSecond++;
    }).pipe(Effect.as(html`<p>second</p>`));
    const third = Effect.sync(() => {
      acquiredThird++;
    }).pipe(Effect.as(html`<p>third</p>`));
    const stopFirst = attachment(runtime, first)(target);
    let stopSecond: (() => void) | void = undefined;
    let stopThird: (() => void) | void = undefined;
    try {
      await expect.poll(() => target.textContent).toBe("first");
      stopFirst?.();
      await cleanupStarted.promise;
      stopSecond = attachment(runtime, second)(target);
      stopSecond?.();
      stopThird = attachment(runtime, third)(target);
      // Let queued promise continuations run while the first finalizer is gated.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      expect(acquiredSecond).toBe(0);
      expect(acquiredThird).toBe(0);
      expect(released).toBe(0);
      gate.resolve();
      await expect.poll(() => target.textContent).toBe("third");
      expect(released).toBe(1);
      expect(acquiredSecond).toBe(0);
      expect(acquiredThird).toBe(1);
    } finally {
      gate.resolve();
      stopFirst?.();
      stopSecond?.();
      stopThird?.();
      await runtime.dispose();
    }
  });
});
