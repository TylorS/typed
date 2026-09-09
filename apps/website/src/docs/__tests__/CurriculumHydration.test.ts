import client from "@typed/astro/client";
import server from "@typed/astro/server";
import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Demo from "../../site/components/CurriculumDemo.js";

const cleanup: Array<() => void> = [];

const island = (markup: string) => {
  const window = new Window({
    url: "https://example.test/typed/explore/quick-start",
  });
  const document = window.document as unknown as Document;
  const host = document.createElement("astro-island");
  host.innerHTML = markup;
  document.body.append(host);
  vi.stubGlobal("window", window);
  vi.stubGlobal("document", document);
  vi.stubGlobal("localStorage", window.localStorage);
  cleanup.push(() => {
    host.dispatchEvent(new window.Event("astro:unmount") as unknown as Event);
    host.remove();
  });
  return host;
};

describe("curriculum Astro islands", () => {
  afterEach(async () => {
    for (const unmount of cleanup.splice(0)) unmount();
    await Promise.resolve();
    vi.unstubAllGlobals();
  });

  it("adopts the server Counter node, restores its value, and wires interaction", async () => {
    const { html } = await server.renderToStaticMarkup(Demo, {
      id: "counter-hydrated",
    });
    const host = island(html);
    const output = host.querySelector<HTMLOutputElement>("output")!;
    const increase = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Increase",
    )!;

    expect(output.textContent).toBe("7");
    expect(host.textContent).toContain("Twice the count: 14");
    await client(host)(Demo, { id: "counter-hydrated" });
    expect(host.querySelector("output")).toBe(output);
    increase.click();
    await vi.waitFor(() => {
      expect(output.textContent).toBe("8");
      expect(host.textContent).toContain("Twice the count: 16");
    });
  });

  const input = (host: Element, selector: string, value: string) => {
    const element = host.querySelector<HTMLInputElement>(selector)!;
    element.value = value;
    element.dispatchEvent(new window.Event("input", { bubbles: true }));
    return element;
  };

  const add = async (host: Element, title: string, count: number) => {
    input(host, ".new-todo", title);
    host
      .querySelector(".add-todo")!
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(count));
  };

  it("runs actual keyed rows through create, cancel, save, toggle and delete", async () => {
    const host = island("<p>Loading</p>");
    await client(host)(Demo, { id: "todo-5" }, {}, { client: "only" });
    expect(host.innerHTML).not.toContain("data-typed-refsubject");
    expect(host.querySelectorAll(".edit")).toHaveLength(0);
    await add(host, "First", 1);
    const first = host.querySelector(".todo-list > li")!;
    await add(host, "Second", 2);
    expect(host.querySelectorAll(".todo-list > li")[1]).toBe(first);

    first.querySelector<HTMLButtonElement>(".edit-trigger")!.click();
    await vi.waitFor(() => expect(first.querySelector(".edit")).not.toBeNull());
    const draft = input(first, ".edit", "Discard this");
    draft.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.waitFor(() => expect(first.querySelector(".view label")?.textContent).toBe("First"));
    first.querySelector<HTMLButtonElement>(".edit-trigger")!.click();
    await vi.waitFor(() => expect(first.querySelector(".edit")).not.toBeNull());
    input(first, ".edit", "Renamed");
    first
      .querySelector(".edit-form")!
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(first.querySelector(".view label")?.textContent).toBe("Renamed"));
    first.querySelector<HTMLInputElement>(".toggle")!.click();
    await vi.waitFor(() => expect(first.classList.contains("completed")).toBe(true));
    first.querySelector<HTMLButtonElement>(".destroy")!.click();
    await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(1));
    expect(host.textContent).toContain("Second");
  });

  it("uses route-derived filtering and the actual storage observer", async () => {
    const host = island("");
    await client(host)(Demo, { id: "todo-8" }, {}, { client: "only" });
    await add(host, "Keep", 1);
    await add(host, "Finish", 2);
    host.querySelector<HTMLInputElement>(".toggle")!.click();
    await vi.waitFor(() => expect(host.querySelector(".clear-completed")).not.toBeNull());
    const completed = [...host.querySelectorAll<HTMLAnchorElement>(".filters a")].find(
      (a) => a.textContent === "Completed",
    )!;
    completed.click();
    await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(1));
    expect(host.querySelector(".todo-list")?.textContent).toContain("Finish");
    expect(host.querySelector(".todo-count")?.textContent?.replace(/\s+/g, " ")).toContain(
      "1 item left",
    );
    expect(window.location.pathname).toBe("/typed/explore/quick-start");
    host.querySelector<HTMLButtonElement>(".clear-completed")!.click();
    await vi.waitFor(() => expect(host.querySelector(".clear-completed")).toBeNull());
    await vi.waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("@typed/tutorial/todo-8")!);
      expect(saved.map((todo: { text: string }) => todo.text)).toEqual(["Keep"]);
    });
    // Remount waits for the previous island's Scope to close before loading storage again.
    await client(host)(Demo, { id: "todo-8" }, {}, { client: "only" });
    await vi.waitFor(() => expect(host.querySelectorAll(".todo-list > li")).toHaveLength(1));
    expect(host.querySelector(".todo-list")?.textContent).toContain("Keep");
  });

  it("keeps two independently provided Todo islands and their derived counts separate", async () => {
    const first = island("");
    const second = document.createElement("astro-island");
    document.body.append(second);
    cleanup.push(() => {
      second.dispatchEvent(new window.Event("astro:unmount"));
      second.remove();
    });
    await client(first)(Demo, { id: "todo-8" }, {}, { client: "only" });
    await client(second)(Demo, { id: "todo-8" }, {}, { client: "only" });
    await add(first, "First island", 1);
    expect(second.querySelectorAll(".todo-list > li")).toHaveLength(0);
    await add(second, "Second island", 1);
    expect(first.querySelector(".todo-list")?.textContent).toContain("First island");
    expect(first.querySelector(".todo-list")?.textContent).not.toContain("Second island");
    expect(second.querySelector(".todo-list")?.textContent).toContain("Second island");
    for (const host of [first, second]) {
      expect(host.querySelector(".todo-count")?.textContent?.replace(/\s+/g, " ")).toContain(
        "1 item left",
      );
    }
  });
});
