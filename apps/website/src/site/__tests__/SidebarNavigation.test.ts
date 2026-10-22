// @vitest-environment happy-dom
import { Effect, Fiber } from "effect";
import { afterEach, expect, it, vi } from "vitest";
import { sidebarNavigation } from "../components/SidebarNavigation.js";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function fixture(reference = false) {
  document.body.innerHTML = reference
    ? '<div class="reference-layout"><nav class="docs-sidebar"><a aria-current="page">Current module</a></nav></div>'
    : '<aside class="docs-sidebar"><nav data-docs-navigation><details open><a aria-current="page">Current lesson</a></details></nav></aside>';
  const sidebar = document.querySelector<HTMLElement>(".docs-sidebar")!;
  const selected = document.querySelector<HTMLElement>('[aria-current="page"]')!;
  Object.defineProperty(sidebar, "clientHeight", { configurable: true, value: 300 });
  vi.spyOn(sidebar, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 400, 220, 300));
  vi.spyOn(selected, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 950, 220, 30));
  return { sidebar, selected };
}

it("reveals the active guide initially and after a captured disclosure event, then stops on interruption", async () => {
  const { sidebar } = fixture();
  const listen = vi.spyOn(document, "addEventListener");
  const fiber = Effect.runFork(sidebarNavigation(document));
  try {
    await vi.waitFor(() =>
      expect(listen.mock.calls.some(([name]) => name === "toggle")).toBe(true),
    );
    expect(sidebar.scrollTop).toBe(415);
    sidebar.scrollTop = 0;
    document.querySelector("details")!.dispatchEvent(new Event("toggle"));
    await vi.waitFor(() => expect(sidebar.scrollTop).toBe(415));
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
  }
  sidebar.scrollTop = 0;
  document.dispatchEvent(new Event("astro:page-load"));
  document.querySelector("details")!.dispatchEvent(new Event("toggle"));
  expect(sidebar.scrollTop).toBe(0);
});

it("measures available reference space, handles replacement markup, and releases window subscriptions", async () => {
  const { sidebar } = fixture(true);
  const listen = vi.spyOn(window, "addEventListener");
  const fiber = Effect.runFork(sidebarNavigation(document));
  try {
    await vi.waitFor(() =>
      expect(listen.mock.calls.some(([name]) => name === "scroll")).toBe(true),
    );
    expect(sidebar.style.maxHeight).toBe(`${Math.max(120, innerHeight - 400 - 24)}px`);
    expect(sidebar.scrollTop).toBe(415);
    const replacement = fixture(true).sidebar;
    document.dispatchEvent(new Event("astro:page-load"));
    await vi.waitFor(() => expect(replacement.scrollTop).toBe(415));
    replacement.scrollTop = 0;
    window.dispatchEvent(new Event("resize"));
    await vi.waitFor(() => expect(replacement.scrollTop).toBe(415));
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
  }
  const replacement = document.querySelector<HTMLElement>(".docs-sidebar")!;
  replacement.style.maxHeight = "123px";
  replacement.scrollTop = 0;
  window.dispatchEvent(new Event("scroll"));
  window.dispatchEvent(new Event("resize"));
  expect(replacement.style.maxHeight).toBe("123px");
  expect(replacement.scrollTop).toBe(0);
});

it("preserves browsing position when another navigation group or article disclosure opens", async () => {
  const { sidebar } = fixture();
  const otherGroup = document.createElement("details");
  otherGroup.open = true;
  otherGroup.innerHTML = "<summary>Other lessons</summary><a>Another lesson</a>";
  sidebar.querySelector("nav")!.append(otherGroup);
  const articleDisclosure = document.createElement("details");
  articleDisclosure.open = true;
  articleDisclosure.innerHTML = '<summary>Example</summary><a aria-current="page">Current tab</a>';
  document.body.append(articleDisclosure);
  const listen = vi.spyOn(document, "addEventListener");
  const fiber = Effect.runFork(sidebarNavigation(document));
  try {
    await vi.waitFor(() =>
      expect(listen.mock.calls.some(([name]) => name === "toggle")).toBe(true),
    );
    sidebar.scrollTop = 120;
    otherGroup.dispatchEvent(new Event("toggle"));
    articleDisclosure.dispatchEvent(new Event("toggle"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sidebar.scrollTop).toBe(120);
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
  }
});

it("leaves hidden entries in collapsed groups alone", async () => {
  const { sidebar, selected } = fixture();
  document.querySelector("details")!.open = false;
  vi.mocked(selected.getBoundingClientRect).mockReturnValue(new DOMRect());
  sidebar.scrollTop = 120;
  const listen = vi.spyOn(window, "addEventListener");
  const fiber = Effect.runFork(sidebarNavigation(document));
  try {
    await vi.waitFor(() =>
      expect(listen.mock.calls.some(([name]) => name === "resize")).toBe(true),
    );
    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sidebar.scrollTop).toBe(120);
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
  }
});
