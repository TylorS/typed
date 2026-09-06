import * as Effect from "effect/Effect";
import * as RefSubject from "@typed/fx/RefSubject";
import { assert, it, vi } from "vitest";
import * as NativePopover from "../NativePopover.js";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it("waits for attachment before opening an initially open native popover", async () => {
  const element = document.createElement("div");
  element.popover = "manual";
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const connected: boolean[] = [];
  const show = element.showPopover.bind(element);
  vi.spyOn(element, "showPopover").mockImplementation(() => {
    connected.push(element.isConnected);
    show();
  });
  try {
    await Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: true });
      yield* NativePopover.ref(state)(element);
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(frames.mock.calls.length > 0 || connected.length > 0)));
      assert.deepEqual(connected, []);
      document.body.append(element);
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(element.matches(":popover-open"))));
      assert.deepEqual(connected, [true]);
    }).pipe(Effect.scoped, Effect.runPromise);
  } finally {
    frames.mockRestore();
    element.remove();
  }
});

it("cancels a pending popover open when state closes before attachment", async () => {
  const element = document.createElement("div");
  element.popover = "manual";
  const show = vi.spyOn(element, "showPopover");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  try {
    await Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: true });
      yield* NativePopover.ref(state)(element);
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(frames.mock.calls.length > 0 || show.mock.calls.length > 0)));
      yield* RefSubject.set(state, { open: false });
      yield* Effect.promise(() => vi.waitFor(() => assert.isAbove(cancel.mock.calls.length, 0)));
      document.body.append(element);
      yield* Effect.promise(nextFrame);
      assert.isFalse(element.matches(":popover-open"));
      assert.strictEqual(show.mock.calls.length, 0);
    }).pipe(Effect.scoped, Effect.runPromise);
  } finally {
    frames.mockRestore();
    cancel.mockRestore();
    element.remove();
  }
});

it("stops a pending native popover open when its Scope ends", async () => {
  const element = document.createElement("div");
  element.popover = "manual";
  const show = vi.spyOn(element, "showPopover");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  try {
    await Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: true });
      yield* NativePopover.ref(state)(element);
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(frames.mock.calls.length > 0 || show.mock.calls.length > 0)));
    }).pipe(Effect.scoped, Effect.runPromise);
    assert.isAbove(cancel.mock.calls.length, 0);
    document.body.append(element);
    await nextFrame();
    assert.isFalse(element.matches(":popover-open"));
    assert.strictEqual(show.mock.calls.length, 0);
  } finally {
    frames.mockRestore();
    cancel.mockRestore();
    element.remove();
  }
});
