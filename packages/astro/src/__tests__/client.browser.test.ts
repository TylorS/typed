/* oxlint-disable require-yield -- Astro components accept stateless generator bodies. */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Option from "effect/Option";
import * as Effect from "effect/Effect";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";
import { component, type Slots } from "../Component.js";
import client from "../client.js";
import server from "../server.js";

const hosts: HTMLElement[] = [];
function host() {
  const element = document.createElement("astro-island");
  document.body.append(element);
  hosts.push(element);
  return element;
}
afterEach(() => {
  for (const element of hosts.splice(0)) {
    element.dispatchEvent(new Event("astro:unmount"));
    element.remove();
  }
});

function counter(finalize: () => void = () => {}) {
  return component(function* (props: { initial: number }) {
    const count = yield* RefSubject.make(props.initial);
    yield* Effect.addFinalizer(() => Effect.sync(finalize));
    return html`<button @click=${RefSubject.update(count, (n) => n + 1)}>${count}</button>`;
  });
}

describe("Typed Astro browser renderer", () => {
  it("hydrates the same DOM node, updates it, and finalizes on Astro unmount", async () => {
    const cleanup = vi.fn();
    const Counter = counter(cleanup);
    const element = host();
    element.innerHTML = (await server.renderToStaticMarkup(Counter, { initial: 1 })).html;
    const original = element.querySelector("button")!;
    await client(element)(Counter, { initial: 1 });
    expect(element.querySelector("button")).toBe(original);
    original.click();
    await vi.waitFor(() => expect(original.textContent).toBe("2"));
    element.dispatchEvent(new Event("astro:unmount"));
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(2));
    original.click();
    expect(original.textContent).toBe("2");
  });

  it("keeps client-only island state isolated", async () => {
    const Counter = counter();
    const first = host();
    const second = host();
    first.innerHTML = "<p>Fallback</p>";
    await Promise.all([
      client(first)(Counter, { initial: 1 }, {}, { client: "only" }),
      client(second)(Counter, { initial: 10 }, {}, { client: "only" }),
    ]);
    first.querySelector("button")!.click();
    await vi.waitFor(() => expect(first.textContent).toBe("2"));
    expect(second.textContent).toBe("10");
    expect(first.querySelector("p")).toBeNull();
  });

  it("replaces previous subscriptions when Astro updates props", async () => {
    const cleanup = vi.fn();
    const Counter = counter(cleanup);
    const element = host();
    const hydrate = client(element);
    await hydrate(Counter, { initial: 1 });
    await hydrate(Counter, { initial: 8 });
    await vi.waitFor(() => expect(element.textContent).toBe("8"));
    expect(cleanup).toHaveBeenCalledTimes(1);
    element.querySelector("button")!.click();
    await vi.waitFor(() => expect(element.textContent).toBe("9"));
  });

  it("waits for old cleanup and keeps only the latest overlapping update", async () => {
    let release!: () => void;
    let finalizing = false;
    const cleanup = new Promise<void>((resolve) => {
      release = resolve;
    });
    const View = component(function* (props: { value: number }) {
      if (props.value === 1) {
        yield* Effect.addFinalizer(() =>
          Effect.promise(() => {
            finalizing = true;
            return cleanup;
          }),
        );
      }
      return html`<p>${props.value}</p>`;
    });
    const element = host();
    const hydrate = client(element);
    const errors = vi.fn();
    element.addEventListener("typed:error", errors);
    await hydrate(View, { value: 1 });
    const second = hydrate(View, { value: 2 });
    await vi.waitFor(() => expect(finalizing).toBe(true));
    const third = hydrate(View, { value: 3 });
    expect(element.textContent).toBe("1");
    release();
    await Promise.all([second, third]);
    expect(element.textContent).toBe("3");
    expect(errors).not.toHaveBeenCalled();
  });

  it("rejects initial failures and closes the component Scope", async () => {
    const finalized = vi.fn();
    const View = component(function* () {
      yield* Effect.addFinalizer(() => Effect.sync(finalized));
      return yield* Effect.fail("failed");
    });
    await expect(client(host())(View, {})).rejects.toBeDefined();
    expect(finalized).toHaveBeenCalledOnce();
  });

  it("rejects a throwing component pipeline and allows the island to retry", async () => {
    const View = component(
      function* (_props: {}) {
        return html`<p>unreachable</p>`;
      },
      () => {
        throw new Error("pipeline failed");
      },
    );
    const hydrate = client(host());

    await expect(hydrate(View, {})).rejects.toBeDefined();
    await hydrate(counter(), { initial: 3 });
  });

  it("updates changed slot content while retaining unchanged slot DOM", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}${slots.heading}</main>`;
    });
    const element = host();
    const hydrate = client(element);
    await hydrate(View, {}, { default: "<p>Before</p>", heading: "<h2>Title</h2>" });
    const heading = element.querySelector("h2");
    await hydrate(View, {}, { default: "<p>After</p>", heading: "<h2>Title</h2>" });
    expect(element.querySelector("p")!.textContent).toBe("After");
    expect(element.querySelector("h2")).toBe(heading);
  });

  it("adopts mutable slot children again when the same island remounts", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}</main>`;
    });
    const element = host();
    const hydrate = client(element);
    const slots = { default: "<button>Server</button>" };

    await hydrate(View, {}, slots);
    element.dispatchEvent(new Event("astro:unmount"));

    const child = element.querySelector("button")!;
    const clicked = vi.fn();
    child.textContent = "Child state";
    child.addEventListener("click", clicked);

    await hydrate(View, {}, slots);
    expect(element.querySelector("button")).toBe(child);
    expect(child.textContent).toBe("Child state");
    child.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("retains mutable borrowed slot children when Astro reserializes them on a parent update", async () => {
    const View = component(function* (props: { title: string }, slots: Slots) {
      return html`<main>
        <h1>${props.title}</h1>
        ${slots.default}
      </main>`;
    });
    const element = host();
    const hydrate = client(element);
    await hydrate(View, { title: "First" }, { default: "<button>Child 0</button>" });
    const child = element.querySelector("button");
    const slot = element.querySelector("astro-slot");
    if (!child || !slot) throw new Error("Missing borrowed slot child");
    const clicked = vi.fn();
    child.addEventListener("click", clicked);
    child.textContent = "Child 1";
    await hydrate(View, { title: "Second" }, { default: slot.innerHTML });
    expect(element.querySelector("button")).toBe(child);
    expect(element.querySelector("h1")?.textContent).toBe("Second");
    child.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("adopts Astro slot nodes without taking over their contents", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}${slots.heading}</main>`;
    });
    const slots = { default: "<button>Child</button>", heading: "<h2>Title</h2>" };
    const element = host();
    element.innerHTML = (
      await server.renderToStaticMarkup(View, {}, slots, {
        displayName: "View",
        hydrate: "load",
        astroStaticSlot: true,
      })
    ).html;
    const main = element.querySelector("main");
    const child = element.querySelector("button");
    const click = vi.fn();
    child!.addEventListener("click", click);
    await client(element)(View, {}, slots);
    expect(element.querySelector("main")).toBe(main);
    expect(element.querySelector("button")).toBe(child);
    child!.click();
    expect(click).toHaveBeenCalledOnce();
    expect(element.querySelector("h2")!.textContent).toBe("Title");
  });

  it("leaves nested island slot nodes to their own renderer", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}${slots.heading}</main>`;
    });
    const element = host();
    element.innerHTML =
      '<astro-slot><astro-island><astro-slot name="heading"><h2>Nested</h2></astro-slot></astro-island></astro-slot><astro-slot name="heading"><h2>Parent</h2></astro-slot>';
    const parent = element.querySelector(':scope > astro-slot[name="heading"] > h2')!;
    const nested = element.querySelector("astro-island h2")!;

    await client(element)(
      View,
      {},
      {
        default: element.querySelector("astro-slot")!.innerHTML,
        heading: "<h2>Parent</h2>",
      },
    );

    expect(element.querySelector('main > astro-slot[name="heading"] > h2')).toBe(parent);
    expect(element.querySelector("main astro-island h2")).toBe(nested);
    expect(nested.textContent).toBe("Nested");
  });
});

it("hydrates zero-argument arbitrary renderables and updates their source", async () => {
  const View = component(function* () {
    const count = yield* RefSubject.make(0);
    return [
      html`<button @click=${RefSubject.update(count, (n) => n + 1)}>Add</button>`,
      Effect.succeed(Option.some(count)),
    ];
  });
  const element = host();
  element.innerHTML = (await server.renderToStaticMarkup(View, {})).html;
  const original = element.querySelector("button");
  await client(element)(View, {});
  expect(element.querySelector("button")).toBe(original);
  expect(element.textContent).toBe("Add0");
  element.querySelector("button")!.click();
  await vi.waitFor(() => expect(element.textContent).toBe("Add1"));
});

it("inserts a borrowed DOM node returned by a client-only generator without cloning it", async () => {
  const node = document.createElement("strong");
  node.textContent = "Borrowed";
  const View = component(function* () {
    return node;
  });
  const element = host();
  await client(element)(View, {}, {}, { client: "only" });
  expect(element.querySelector("strong")).toBe(node);
});
