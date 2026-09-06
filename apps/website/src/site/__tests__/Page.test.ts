// @vitest-environment happy-dom
import { Effect, Fiber } from "effect";
import { expect, it, vi } from "vitest";
import { page } from "../Page.js";

// Navigation must be usable even when a diagram has not finished mounting.
vi.mock("../components/MarblePlayback.js", () => ({ enhanceMarbles: () => Effect.never }));

it("reveals the selected article while diagrams are still hydrating", async () => {
  const host = document.createElement("aside");
  host.className = "docs-sidebar";
  host.innerHTML = '<nav data-docs-navigation><a aria-current="page">Current article</a></nav>';
  document.body.append(host);
  Object.defineProperty(host, "clientHeight", { value: 200 });
  vi.spyOn(host, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 100, 200, 200));
  vi.spyOn(host.querySelector("a")!, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 500, 200, 40));
  const fiber = Effect.runFork(page(document));
  try {
    await vi.waitFor(() => expect(host.scrollTop).toBe(320));
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
    host.remove();
    vi.restoreAllMocks();
  }
});
