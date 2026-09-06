// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import client from "@typed/astro/client";
import server from "@typed/astro/server";
import Theme from "../components/Theme.js";

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) {
    host.dispatchEvent(new Event("astro:unmount"));
    host.remove();
  }
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

async function mount(dark = true) {
  const media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, "matches", { value: dark, writable: true });
  vi.spyOn(window, "matchMedia").mockReturnValue(media);
  const host = document.createElement("astro-island");
  host.innerHTML = (await server.renderToStaticMarkup(Theme, {})).html;
  document.body.append(host);
  hosts.push(host);
  await client(host)(Theme, {});
  const button = host.querySelector("button")!;
  const setSystem = (matches: boolean) => {
    Object.defineProperty(media, "matches", { value: matches });
    media.dispatchEvent(new MediaQueryListEvent("change", { matches }));
  };
  return { host, button, setSystem };
}

const expectTheme = (theme: string) =>
  vi.waitFor(() => expect(document.documentElement.dataset.theme).toBe(theme));

describe("Typed website theme", () => {
  it("follows the system until the reader chooses a theme", async () => {
    const { button, setSystem } = await mount();
    await expectTheme("matrix");
    setSystem(false);
    await expectTheme("matrix-light");
    button.click();
    await expectTheme("matrix");
    expect(localStorage.getItem("typed-theme")).toBe("matrix");
    setSystem(true);
    setSystem(false);
    await expectTheme("matrix");
  });

  it("loads the saved theme and follows cross-tab changes and preference removal", async () => {
    localStorage.setItem("typed-theme", "matrix-light");
    await mount();
    await expectTheme("matrix-light");
    localStorage.setItem("typed-theme", "matrix");
    window.dispatchEvent(new StorageEvent("storage", { key: "typed-theme", newValue: "matrix" }));
    await expectTheme("matrix");
    localStorage.setItem("typed-theme", "matrix-light");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "typed-theme", newValue: "matrix-light" }),
    );
    await expectTheme("matrix-light");
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    await expectTheme("matrix");
  });

  it("keeps the current page usable when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    const { button } = await mount(false);
    await expectTheme("matrix-light");
    button.click();
    await expectTheme("matrix");
    const removed = vi.spyOn(window, "removeEventListener");
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    await vi.waitFor(() =>
      expect(removed.mock.calls.some(([type]) => type === "storage")).toBe(true),
    );
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await expectTheme("matrix");
  });

  it("reacquires browser preferences after a cached return and cleans up on unmount", async () => {
    const { host, setSystem } = await mount();
    await expectTheme("matrix");
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    setSystem(false);
    expect(document.documentElement.dataset.theme).toBe("matrix");
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await expectTheme("matrix-light");
    host.dispatchEvent(new Event("astro:unmount"));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    setSystem(true);
    window.dispatchEvent(new StorageEvent("storage", { key: "typed-theme" }));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(document.documentElement.dataset.theme).toBe("matrix-light");
  });
});
