// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import client from "@typed/astro/client";
import server from "@typed/astro/server";
import type { SearchArtifact } from "../../docs/Search.js";
import Search from "../components/Search.js";

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) {
    host.dispatchEvent(new Event("astro:unmount"));
    host.remove();
  }
  vi.unstubAllGlobals();
});

async function mount() {
  const host = document.createElement("astro-island");
  host.innerHTML = (await server.renderToStaticMarkup(Search, {})).html;
  document.body.append(host);
  hosts.push(host);
  await client(host)(Search, {});
  const trigger = host.querySelector<HTMLButtonElement>(".search-trigger");
  const dialog = host.querySelector("dialog");
  const input = host.querySelector("input");
  if (!trigger || !dialog || !input) throw new Error("Search controls missing");
  return { host, trigger, dialog, input };
}

const artifact: SearchArtifact = {
  schemaVersion: 1,
  prefixes: { refsubject: [0] },
  trigrams: {},
  entries: [
    {
      id: "ref",
      title: "RefSubject",
      kind: "module",
      href: "/reference/ref",
      text: "reactive state",
    },
  ],
};

describe("Astro Typed search", () => {
  it("renders closed and hydrates without requesting an index", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { dialog, host } = await mount();
    expect(dialog.open).toBe(false);
    expect(host.textContent).toContain("Search docs");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cancels superseded requests and closes the active request with the island", async () => {
    const requests: { signal: AbortSignal | undefined; resolve: (response: Response) => void }[] =
      [];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: RequestInfo | URL, options?: RequestInit) =>
          new Promise<Response>((resolve) => {
            requests.push({ signal: options?.signal ?? undefined, resolve });
          }),
      ),
    );
    const { host, trigger, dialog, input } = await mount();
    trigger.click();
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    input.value = "first";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(requests).toHaveLength(1));
    input.value = "RefSubject";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0]?.signal?.aborted).toBe(true);
    requests[1]?.resolve(new Response(JSON.stringify(artifact)));
    await vi.waitFor(() =>
      expect(host.querySelector(".search-results a")?.textContent).toContain("RefSubject"),
    );
    requests[0]?.resolve(new Response(JSON.stringify({ ...artifact, entries: [] })));
    expect(host.querySelector(".search-results a")?.textContent).toContain("RefSubject");
    dialog.close();
    host.dispatchEvent(new Event("astro:unmount"));
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );
    expect(dialog.open).toBe(false);
  });

  it.each(["close", "unmount"] as const)("aborts a pending fetch on %s", async (action) => {
    let signal: AbortSignal | null | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: RequestInfo | URL, options?: RequestInit) => {
        signal = options?.signal;
        return new Promise<Response>(() => {});
      }),
    );
    const { host, trigger, dialog, input } = await mount();
    trigger.click();
    input.value = "hydrate";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(signal).toBeDefined());
    if (action === "close") dialog.close();
    else host.dispatchEvent(new Event("astro:unmount"));
    await vi.waitFor(() => expect(signal?.aborted).toBe(true));
  });

  it("opens from the shortcut and reports errors and empty results", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(artifact)));
    vi.stubGlobal("fetch", fetch);
    const { host, dialog, input } = await mount();
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, cancelable: true, bubbles: true }),
    );
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    input.value = "first";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.textContent).toContain("Search is unavailable"));
    input.value = "no-such-api";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.textContent).toContain("No results"));
    expect(fetch).toHaveBeenCalledTimes(2);
    input.value = "another-missing-api";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.textContent).toContain("another-missing-api"));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("moves focus through native links, opens from the input, and clears before closing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(artifact))));
    const { host, dialog, input, trigger } = await mount();
    trigger.click();
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    input.focus();
    input.value = "RefSubject";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.querySelector(".search-result-link")).not.toBeNull());
    const link = host.querySelector<HTMLAnchorElement>(".search-result-link")!;
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(link);
    link.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(input);
    const clicked = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener("click", clicked);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(clicked).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(dialog.open).toBe(false));
    trigger.click();
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(input.value).toBe(""));
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(dialog.open).toBe(false));
  });

  it("cancels browser defaults synchronously and releases global keyboard handling with its scope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(artifact))));
    const { host, dialog, input } = await mount();
    const shortcut = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    input.focus();
    input.value = "RefSubject";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.querySelector(".search-result-link")).not.toBeNull());
    const down = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(host.querySelector(".search-result-link"));
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(input.value).toBe(""));
    expect(dialog.open).toBe(true);
    dialog.close();
    host.dispatchEvent(new Event("astro:unmount"));
    await vi.waitFor(() => {
      const afterUnmount = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(afterUnmount);
      expect(afterUnmount.defaultPrevented).toBe(false);
      expect(dialog.open).toBe(false);
    });
  });

  it("retries interrupted loading and retains only successful results within the island", async () => {
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        (_url: RequestInfo | URL, options?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(new Error("Aborted")), {
              once: true,
            });
          }),
      )
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(artifact))));
    vi.stubGlobal("fetch", fetch);
    const first = await mount();
    first.trigger.click();
    first.input.value = "RefSubject";
    first.input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    first.dialog.close();
    await vi.waitFor(() =>
      expect((fetch.mock.calls[0]?.[1] as RequestInit)?.signal?.aborted).toBe(true),
    );
    first.trigger.click();
    await vi.waitFor(() => expect(first.host.querySelector(".search-result-link")).not.toBeNull());
    expect(fetch).toHaveBeenCalledTimes(2);
    first.input.value = "another-query";
    first.input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(first.host.textContent).toContain("No results"));
    expect(fetch).toHaveBeenCalledTimes(2);
    first.dialog.close();
    first.host.dispatchEvent(new Event("astro:unmount"));
    const second = await mount();
    second.trigger.click();
    second.input.value = "RefSubject";
    second.input.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(second.host.querySelector(".search-result-link")).not.toBeNull());
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
