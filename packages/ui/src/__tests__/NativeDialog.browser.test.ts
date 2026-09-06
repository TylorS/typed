import * as Effect from "effect/Effect";
import * as RefSubject from "@typed/fx/RefSubject";
import { expect, it, vi } from "vitest";
import * as NativeDialog from "../NativeDialog.js";

it("defers native modal opening until its ref element is connected", async () => {
  const dialog = document.createElement("dialog");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const connected: boolean[] = [];
  const nativeShowModal = dialog.showModal.bind(dialog);
  vi.spyOn(dialog, "showModal").mockImplementation(() => {
    connected.push(dialog.isConnected);
    nativeShowModal();
  });
  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const state = yield* RefSubject.make({ open: true });
        yield* NativeDialog.ref(state)(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(frames).toHaveBeenCalled()));
        document.body.append(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(dialog.open).toBe(true)));
        expect(connected).toEqual([true]);
      }).pipe(Effect.scoped),
    );
  } finally {
    frames.mockRestore();
    dialog.remove();
  }
});

it("cancels an initial open when state closes before attachment", async () => {
  const dialog = document.createElement("dialog");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  const show = vi.spyOn(dialog, "showModal");
  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const state = yield* RefSubject.make({ open: true });
        yield* NativeDialog.ref(state)(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(frames).toHaveBeenCalled()));
        yield* RefSubject.set(state, { open: false });
        yield* Effect.promise(() => vi.waitFor(() => expect(cancel).toHaveBeenCalled()));
        document.body.append(dialog);
        yield* Effect.promise(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
        );
        expect(dialog.open).toBe(false);
        expect(show).not.toHaveBeenCalled();
      }).pipe(Effect.scoped),
    );
  } finally {
    frames.mockRestore();
    cancel.mockRestore();
    dialog.remove();
  }
});

it("cancels its pending connection check when the Scope closes", async () => {
  const dialog = document.createElement("dialog");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  const show = vi.spyOn(dialog, "showModal");
  const cancel = vi.spyOn(window, "cancelAnimationFrame");
  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const state = yield* RefSubject.make({ open: true });
        yield* NativeDialog.ref(state)(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(frames).toHaveBeenCalled()));
      }).pipe(Effect.scoped),
    );
    expect(cancel).toHaveBeenCalled();
    document.body.append(dialog);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(dialog.open).toBe(false);
    expect(show).not.toHaveBeenCalled();
  } finally {
    frames.mockRestore();
    cancel.mockRestore();
    dialog.remove();
  }
});

it("opens after delayed insertion into a connected closed shadow root", async () => {
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "closed" });
  document.body.append(host);
  const dialog = document.createElement("dialog");
  const frames = vi.spyOn(window, "requestAnimationFrame");
  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const state = yield* RefSubject.make({ open: true });
        yield* NativeDialog.ref(state)(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(frames).toHaveBeenCalled()));
        expect(dialog.open).toBe(false);
        shadow.append(dialog);
        yield* Effect.promise(() => vi.waitFor(() => expect(dialog.open).toBe(true)));
        expect(dialog.isConnected).toBe(true);
      }).pipe(Effect.scoped),
    );
  } finally {
    frames.mockRestore();
    host.remove();
  }
});

it("applies connected transitions before publishing the next open state", async () => {
  const dialog = document.createElement("dialog");
  document.body.append(dialog);
  try {
    await Effect.runPromise(Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: true });
      yield* NativeDialog.ref(state)(dialog);
      // Wait for the scoped observer to subscribe before checking subsequent publications.
      yield* Effect.promise(() => vi.waitFor(() => expect(dialog.open).toBe(true)));
      yield* RefSubject.set(state, { open: false });
      expect(dialog.open).toBe(false);
      yield* RefSubject.set(state, { open: true });
      expect(dialog.open).toBe(true);
    }).pipe(Effect.scoped));
  } finally {
    dialog.close();
    dialog.remove();
  }
});
