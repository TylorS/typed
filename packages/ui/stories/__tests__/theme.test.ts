// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { observeTheme } from "../../.storybook/theme.js";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0)) await dispose();
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Storybook color theme", () => {
  it("uses the saved preference when opened on its own", async () => {
    localStorage.setItem("typed-theme", "matrix");
    const changed = vi.fn();
    cleanup.push(observeTheme(changed));
    expect(changed).toHaveBeenCalledExactlyOnceWith("matrix");
    expect(document.documentElement.dataset.theme).toBe("matrix");
    localStorage.setItem("typed-theme", "matrix-light");
    window.dispatchEvent(new StorageEvent("storage", { key: "typed-theme" }));
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("matrix-light"));
  });

  it("follows the containing website without replacing the active story", async () => {
    document.documentElement.dataset.theme = "matrix";
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const view = iframe.contentWindow!;
    const button = view.document.createElement("button");
    button.textContent = "A story with state";
    view.document.body.append(button);
    const changed = vi.fn();
    cleanup.push(observeTheme(changed, view));
    expect(view.document.documentElement.dataset.theme).toBe("matrix");
    document.documentElement.dataset.theme = "matrix-light";
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("matrix-light"));
    expect(view.document.querySelector("button")).toBe(button);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("inherits the top-level theme through the manager and preview frames", async () => {
    document.documentElement.dataset.theme = "matrix";
    localStorage.setItem("typed-theme", "matrix-light");
    const manager = document.createElement("iframe");
    document.body.append(manager);
    const preview = manager.contentDocument!.createElement("iframe");
    manager.contentDocument!.body.append(preview);
    const changed = vi.fn();
    cleanup.push(observeTheme(changed, preview.contentWindow!));
    expect(changed).toHaveBeenCalledExactlyOnceWith("matrix");
    document.documentElement.dataset.theme = "matrix-light";
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("matrix-light"));
  });

  it("falls back to system changes when storage is unavailable", async () => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    vi.spyOn(window, "matchMedia").mockReturnValue(system);
    const matches = vi.spyOn(system, "matches", "get").mockReturnValue(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage disabled");
    });
    const changed = vi.fn();
    cleanup.push(observeTheme(changed));
    expect(changed).toHaveBeenCalledExactlyOnceWith("matrix");
    matches.mockReturnValue(false);
    system.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("matrix-light"));
  });

  it("pauses native observation while cached and refreshes on restoration", async () => {
    document.documentElement.dataset.theme = "matrix";
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const view = iframe.contentWindow!;
    const added = vi.spyOn(view, "addEventListener");
    const removed = vi.spyOn(view, "removeEventListener");
    const disconnected = vi.spyOn(MutationObserver.prototype, "disconnect");
    const changed = vi.fn();
    const dispose = observeTheme(changed, view);
    cleanup.push(dispose);
    await vi.waitFor(() => expect(added).toHaveBeenCalledWith("storage", expect.any(Function)));
    view.dispatchEvent(new Event("pagehide"));
    await vi.waitFor(() => expect(removed).toHaveBeenCalledWith("storage", expect.any(Function)));
    expect(disconnected).toHaveBeenCalled();
    document.documentElement.dataset.theme = "matrix-light";
    view.dispatchEvent(new StorageEvent("storage", { key: "typed-theme" }));
    expect(changed).toHaveBeenCalledExactlyOnceWith("matrix");

    view.dispatchEvent(new Event("pageshow"));
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("matrix-light"));
    view.dispatchEvent(new Event("pageshow"));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(changed).toHaveBeenCalledTimes(2);

    await dispose();
    expect(removed).toHaveBeenCalledWith("pagehide", expect.any(Function));
    expect(removed).toHaveBeenCalledWith("pageshow", expect.any(Function));
    document.documentElement.dataset.theme = "matrix";
    view.dispatchEvent(new Event("pageshow"));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("releases subscriptions when the Storybook module is replaced", async () => {
    document.documentElement.dataset.theme = "matrix";
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const changed = vi.fn();
    const dispose = observeTheme(changed, iframe.contentWindow!);
    await dispose();
    document.documentElement.dataset.theme = "matrix-light";
    iframe.contentWindow!.dispatchEvent(new StorageEvent("storage"));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(changed).toHaveBeenCalledExactlyOnceWith("matrix");
  });
});
