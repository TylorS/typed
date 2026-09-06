// @vitest-environment happy-dom
import { Fx } from "@typed/fx";
import { Effect, Fiber } from "effect";
import { describe, expect, it, vi } from "vitest";
import { events, whilePageActive } from "../Browser.js";

describe("browser source ownership", () => {
  it("interrupts a pending event handler and detaches its source", async () => {
    const target = new EventTarget();
    const started = vi.fn();
    const stopped = vi.fn();
    const fiber = Effect.runFork(
      events(target, "work").pipe(
        Fx.observe(() =>
          Effect.acquireUseRelease(
            Effect.sync(started),
            () => Effect.never,
            () => Effect.sync(stopped),
          ),
        ),
      ),
    );
    target.dispatchEvent(new Event("work"));
    await vi.waitFor(() => expect(started).toHaveBeenCalledOnce());
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(stopped).toHaveBeenCalledOnce();
    target.dispatchEvent(new Event("work"));
    expect(started).toHaveBeenCalledOnce();
  });

  it("releases page work before reacquiring it on a cached return", async () => {
    const order: string[] = [];
    const work = Effect.acquireRelease(
      Effect.sync(() => order.push("start")),
      () => Effect.sync(() => order.push("stop")),
    );
    const fiber = Effect.runFork(whilePageActive(window, work));
    await vi.waitFor(() => expect(order).toEqual(["start"]));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    await vi.waitFor(() => expect(order).toEqual(["start", "stop"]));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await vi.waitFor(() => expect(order).toEqual(["start", "stop", "start"]));
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(order).toEqual(["start", "stop", "start", "stop"]);
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    expect(order).toHaveLength(4);
  });
});
