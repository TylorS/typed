import * as Layer from "effect/Layer";
import { RandomValues } from "@typed/id/RandomValues";
import { afterEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { Cause, Deferred, Effect, Exit, Fiber } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { tick } from "svelte";
import Stateful from "./fixtures/Stateful.svelte";
import RoundTrip from "./fixtures/RoundTrip.svelte";
import Placed from "./fixtures/Placed.svelte";
import Throws from "./fixtures/Throws.svelte";
import { siblings } from "./fixtures/trees.js";
import { view } from "../view.js";

describe("Svelte view DOM renderer", () => {
  const roots = new Set<HTMLElement>();

  afterEach(() => {
    for (const root of roots) root.remove();
    roots.clear();
  });

  it("preserves native ref timing and places the mounted component in the parent tree", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    roots.add(root);
    const observed: Array<{ connected: boolean; width: number; focused: boolean }> = [];
    const app = html`<main>
      <section>
        ${view(Placed, { onMounted: (state) => observed.push(state) }, { id: "placed" })}
      </section>
    </main>`;
    await Effect.gen(function* () {
      yield* Fx.collectAll(Fx.take(render(app, root), 1));
      expect(observed).toHaveLength(1);
      expect(root.querySelector("[data-placement]")?.isConnected).toBe(true);
    }).pipe(
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
      Effect.scoped,
      Effect.runPromise,
    );
  });

  it("publishes a closed empty host without mounting when the props source is empty", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    roots.add(root);

    await render(view(Throws, Fx.empty, { id: "empty" }), root).pipe(
      Fx.take(1),
      Fx.drain,
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
      Effect.scoped,
      Effect.runPromise,
    );

    const host = root.querySelector("#empty");
    expect(host).not.toBeNull();
    expect(host?.childNodes).toHaveLength(1);
    expect(host?.firstChild?.nodeType).toBe(Node.COMMENT_NODE);
    expect(host?.getAttribute("style")).toBe("display: contents");
  });

  it("mounts once, updates props through a store, and unmounts with the Typed scope", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    roots.add(root);

    let mounts = 0;
    let destroys = 0;
    const onMounted = () => mounts++;
    const onDestroyed = () => destroys++;

    await Effect.gen(function* () {
      const props = yield* RefSubject.make({ label: "one", onMounted, onDestroyed });

      yield* view(Stateful, props, { id: "counter" }).pipe(
        render(root),
        Fx.drain,
        Effect.forkScoped,
      );
      yield* waitForText(root, "one:0");

      const button = root.querySelector<HTMLButtonElement>("[data-stateful]")!;
      button.click();
      yield* Effect.promise(() => tick());
      expect(button.textContent).toBe("one:1");

      yield* RefSubject.set(props, { label: "two", onMounted, onDestroyed });
      yield* waitForText(root, "two:1");

      expect(root.querySelector("[data-stateful]")).toBe(button);
      expect(mounts).toBe(1);
      expect(destroys).toBe(0);
    }).pipe(
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
      Effect.scoped,
      Effect.runPromise,
    );

    await expect.poll(() => destroys).toBe(1);
    expect(root.querySelector("[data-stateful]")).toBeNull();
  });

  it("mounts once when merged sources concurrently emit their initial props", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    roots.add(root);
    let mounts = 0;
    let destroys = 0;
    const onMounted = () => {
      mounts++;
    };
    const onDestroyed = () => {
      destroys++;
    };
    const props = Fx.mergeAll(
      Fx.succeed({ label: "first", onMounted, onDestroyed }),
      Fx.succeed({ label: "second", onMounted, onDestroyed }),
    );
    await Effect.gen(function* () {
      yield* render(view(Stateful, props, { id: "concurrent" }), root).pipe(
        Fx.drain,
        Effect.forkScoped,
      );
      yield* waitForText(root, "second:0");
      expect(mounts).toBe(1);
      expect(destroys).toBe(0);
      expect(root.querySelectorAll("[data-stateful]")).toHaveLength(1);
      const button = root.querySelector<HTMLButtonElement>("[data-stateful]")!;
      button.click();
      yield* Effect.promise(() => tick());
      expect(button.textContent).toBe("second:1");
    }).pipe(
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
      Effect.scoped,
      Effect.runPromise,
    );
    expect(mounts).toBe(1);
    expect(destroys).toBe(1);
    expect(root.querySelector("[data-stateful]")).toBeNull();
  });

  it("hydrates Svelte server output in place before accepting Typed prop updates", async () => {
    const root = document.createElement("div");
    root.innerHTML = (await commands.renderSvelteFixture("island", "server")).html;
    document.body.append(root);
    roots.add(root);

    const serverButton = root.querySelector<HTMLButtonElement>("[data-stateful]")!;
    let mounts = 0;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => void 0);
    const error = vi.spyOn(console, "error").mockImplementation(() => void 0);

    try {
      await Effect.gen(function* () {
        const props = yield* RefSubject.make({ label: "server", onMounted: () => mounts++ });

        yield* view(Stateful, props, { id: "counter" }).pipe(
          render(root),
          Fx.drain,
          Effect.forkScoped,
        );
        yield* Effect.promise(() => expect.poll(() => mounts).toBe(1));

        expect(root.querySelector("[data-stateful]")).toBe(serverButton);

        serverButton.click();
        yield* Effect.promise(() => tick());
        expect(serverButton.textContent).toBe("server:1");

        yield* RefSubject.set(props, { label: "client", onMounted: () => mounts++ });
        yield* waitForText(root, "client:1");

        expect(root.querySelector("[data-stateful]")).toBe(serverButton);
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );

      expect(warn.mock.calls.flat().join("\n")).not.toContain("hydration");
      expect(error.mock.calls.flat().join("\n")).not.toContain("hydration");
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });
});

function waitForText(root: HTMLElement, text: string): Effect.Effect<void> {
  return Effect.promise(() => expect.poll(() => root.textContent).toContain(text));
}

describe("Svelte hydration boundaries and failures", () => {
  it("does not publish a raw value when initial component construction fails", async () => {
    let outputs = 0;
    const result = await view(Throws, { message: "mount failed" }, { id: "failed-mount" }).pipe(
      Fx.observe(() => {
        outputs++;
      }),
      Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
      Effect.scoped,
      Effect.exit,
      Effect.runPromise,
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) expect(Cause.pretty(result.cause)).toContain("mount failed");
    expect(outputs).toBe(0);
  });

  it("hydrates sibling islands independently and preserves local state", async () => {
    const root = document.createElement("div");
    root.innerHTML = (await commands.renderSvelteFixture("siblings", "first")).html;
    document.body.append(root);
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-stateful]"));
    const between = root.querySelector("[data-between]");
    expect(buttons[0].id).not.toBe(buttons[1].id);
    try {
      await Effect.gen(function* () {
        let ready = 0;
        const onMounted = () => {
          ready++;
        };
        const props = yield* RefSubject.make({ label: "first", onMounted });
        const app = siblings(
          view(Stateful, props, { id: "counter" }),
          view(Stateful, { label: "sibling", onMounted }, { id: "sibling" }),
        );
        yield* render(app, root).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() => expect.poll(() => ready).toBe(2));
        yield* Effect.promise(() => tick());
        buttons[0].click();
        buttons[1].click();
        buttons[1].click();
        yield* Effect.promise(() => tick());
        yield* RefSubject.set(props, { label: "updated", onMounted });
        yield* waitForText(root, "updated:1betweensibling:2");
        expect(Array.from(root.querySelectorAll("[data-stateful]"))).toEqual(buttons);
        expect(root.querySelector("[data-between]")).toBe(between);
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      root.remove();
    }
  });

  it("unmounts when a props source fails and preserves its error", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let destroyed = 0;
    try {
      await Effect.gen(function* () {
        const failed = yield* Deferred.make<never, string>();
        const source = Fx.concat(
          Fx.succeed({
            label: "mounted",
            onDestroyed: () => {
              destroyed++;
            },
          }),
          Fx.fromEffect(Deferred.await(failed)),
        );
        const fiber = yield* render(view(Stateful, source, { id: "counter" }), root).pipe(
          Fx.drain,
          Effect.forkScoped,
        );
        yield* waitForText(root, "mounted:0");
        yield* Deferred.fail(failed, "props failed");
        const result = yield* Fiber.await(fiber);
        expect(Exit.isFailure(result)).toBe(true);
        if (Exit.isFailure(result)) expect(Cause.hasFails(result.cause)).toBe(true);
        yield* Effect.promise(() => expect.poll(() => destroyed).toBe(1));
        expect(root.querySelector("[data-stateful]")).toBeNull();
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      root.remove();
    }
  });

  it("cancels acquisition before the first props value", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let acquired = 0;
    let released = 0;
    const props = Fx.unwrap(
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ).pipe(Effect.as(Fx.never)),
    );
    try {
      await Effect.gen(function* () {
        const fiber = yield* render(view(Stateful, props, { id: "counter" }), root).pipe(
          Fx.drain,
          Effect.forkScoped,
        );
        yield* Effect.promise(() => expect.poll(() => acquired).toBe(1));
        yield* Fiber.interrupt(fiber);
        expect(released).toBe(1);
        expect(root.querySelector("[data-stateful]")).toBeNull();
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      root.remove();
    }
  });

  it("releases prepared props when the parent rendering scope closes", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let acquired = 0;
    let released = 0;
    let mounted = 0;
    const props = Fx.fromEffect(
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return {
            label: "prepared",
            onMounted: () => {
              mounted++;
            },
          };
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const app = html`<section>${view(Stateful, props, { id: "prepared" })}${Fx.never}</section>`;
    try {
      await Effect.gen(function* () {
        const fiber = yield* render(app, root).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() => expect.poll(() => acquired).toBe(1));
        yield* Fiber.interrupt(fiber);
        expect(mounted).toBe(1);
        expect(root.querySelector("[data-stateful]")).toBeNull();
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
      expect(released).toBe(1);
    } finally {
      root.remove();
    }
  });
});

describe("Svelte published scope ownership", () => {
  it("retains a first RenderEvent's live component until the ambient Scope closes", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let destroyed = 0;
    try {
      await Effect.gen(function* () {
        const props = yield* RefSubject.make({
          label: "before",
          onDestroyed: () => {
            destroyed++;
          },
        });
        yield* Fx.collectAll(Fx.take(render(view(Stateful, props, { id: "counter" }), root), 1));
        const node = root.querySelector<HTMLButtonElement>("[data-stateful]");
        expect(node?.textContent).toBe("before:0");
        yield* RefSubject.set(props, {
          label: "after",
          onDestroyed: () => {
            destroyed++;
          },
        });
        yield* waitForText(root, "after:0");
        expect(root.querySelector("[data-stateful]")).toBe(node);
        expect(destroyed).toBe(0);
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
      expect(destroyed).toBe(1);
      expect(root.querySelector("[data-stateful]")).toBeNull();
    } finally {
      root.remove();
    }
  });
});

describe("nested renderer ownership", () => {
  it("hydrates Typed inside an opaque Svelte island and retains both runtimes' nodes", async () => {
    const fixture = await commands.renderSvelteFixture("round-trip", "server");
    const root = document.createElement("div");
    root.innerHTML = fixture.html;
    document.body.append(root);
    const serverButton = root.querySelector<HTMLButtonElement>("[data-round-trip]");
    const host = root.querySelector("#round-trip");
    let ready = false;
    try {
      await Effect.gen(function* () {
        const label = yield* RefSubject.make("server");
        yield* render(
          view(
            RoundTrip,
            {
              label,
              onReady: () => {
                ready = true;
              },
            },
            { id: "round-trip" },
          ),
          root,
        ).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() => expect.poll(() => ready).toBe(true));
        expect(root.querySelector("#round-trip")).toBe(host);
        expect(root.querySelector("[data-round-trip]")).toBe(serverButton);
        yield* RefSubject.set(label, "client");
        yield* Effect.promise(() => expect.poll(() => serverButton?.textContent).toBe("client"));
        expect(root.querySelector("[data-round-trip]")).toBe(serverButton);
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      root.remove();
    }
  });
});
