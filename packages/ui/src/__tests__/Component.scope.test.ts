import { Effect, Exit, Fiber, Scope } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import { expect, it, vi } from "vitest";
import { component } from "../Component.js";

it("forks distinct sibling scopes shared by each generator and its returned Fx", async () => {
  const parent = Scope.makeUnsafe();
  const scopes = new Map<string, Scope.Scope[]>();
  const closed: string[] = [];
  const View = component(function* (name: string) {
    scopes.set(name, [yield* Scope.Scope]);
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        closed.push(`${name}:setup`);
      }),
    );
    return Fx.gen(function* () {
      scopes.get(name)!.push(yield* Scope.Scope);
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          closed.push(`${name}:source`);
        }),
      );
      return Fx.never;
    });
  });
  const run = (name: string) => Effect.runFork(View(name).pipe(Fx.drain, Scope.provide(parent)));
  const first = run("first");
  const second = run("second");
  try {
    await vi.waitFor(() =>
      expect([...scopes.values()].map((value) => value.length)).toEqual([2, 2]),
    );
    expect(scopes.get("first")![0]).toBe(scopes.get("first")![1]);
    expect(scopes.get("second")![0]).toBe(scopes.get("second")![1]);
    expect(scopes.get("first")![0]).not.toBe(parent);
    expect(scopes.get("first")![0]).not.toBe(scopes.get("second")![0]);
    expect(closed).toEqual([]);
    await Effect.runPromise(Fiber.interrupt(first));
    expect(closed).toEqual(["first:source", "first:setup"]);
    await Effect.runPromise(Scope.close(parent, Exit.void));
    expect(closed).toEqual(["first:source", "first:setup", "second:source", "second:setup"]);
  } finally {
    await Effect.runPromise(Fiber.interrupt(first));
    await Effect.runPromise(Fiber.interrupt(second));
    await Effect.runPromise(Scope.close(parent, Exit.void));
  }
});

it.each(["complete", "setup failure", "source failure"] as const)(
  "closes the component child on %s while the parent remains open",
  async (mode) => {
    const parent = Scope.makeUnsafe();
    const closed: string[] = [];
    await Effect.runPromise(
      Scope.addFinalizer(
        parent,
        Effect.sync(() => {
          closed.push("parent");
        }),
      ),
    );
    const View = component(function* () {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          closed.push("setup");
        }),
      );
      if (mode === "setup failure") return yield* Effect.fail("setup failed");
      return Fx.gen(function* () {
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            closed.push("source");
          }),
        );
        return mode === "source failure" ? Fx.fail("source failed") : Fx.succeed("ready");
      });
    });
    const exit = await Effect.runPromiseExit(View.pipe(Fx.collectAll, Scope.provide(parent)));
    expect(Exit.isSuccess(exit)).toBe(mode === "complete");
    expect(closed).toEqual(mode === "setup failure" ? ["setup"] : ["source", "setup"]);
    await Effect.runPromise(Scope.close(parent, Exit.void));
    expect(closed.at(-1)).toBe("parent");
  },
);

it("keeps returned template refs and subscriptions alive until that instance stops", async () => {
  const window = new Window() as unknown as globalThis.Window & typeof globalThis;
  const parent = Scope.makeUnsafe();
  let acquired = 0;
  let released = 0;
  let setupScope: Scope.Scope | undefined;
  let refScope: Scope.Scope | undefined;
  const View = component(function* () {
    setupScope = yield* Scope.Scope;
    const count = yield* RefSubject.make(0);
    return html`<button
      ref=${() =>
        Effect.gen(function* () {
          refScope = yield* Scope.Scope;
          yield* Effect.acquireRelease(
            Effect.sync(() => {
              acquired++;
            }),
            () =>
              Effect.sync(() => {
                released++;
              }),
          );
        })}
      @click=${RefSubject.update(count, (n) => n + 1)}
    >
      ${count}
    </button>`;
  });
  const fiber = Effect.runFork(
    render(View, window.document.body).pipe(
      Fx.provide(DomRenderTemplate.using(window.document)),
      Fx.drain,
      Scope.provide(parent),
    ),
  );
  try {
    await vi.waitFor(() => expect(window.document.body.textContent?.trim()).toBe("0"));
    expect(acquired).toBe(1);
    expect(released).toBe(0);
    expect(refScope).toBe(setupScope);
    const button = window.document.querySelector("button")!;
    button.click();
    await vi.waitFor(() => expect(button.textContent?.trim()).toBe("1"));
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(released).toBe(1);
    button.click();
    expect(button.textContent?.trim()).toBe("1");
    await Effect.runPromise(Scope.close(parent, Exit.void));
    expect(released).toBe(1);
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
    await Effect.runPromise(Scope.close(parent, Exit.void));
  }
});

it("releases an infinite source when a downstream consumer takes its first value", async () => {
  const parent = Scope.makeUnsafe();
  let released = 0;
  const View = component(function* () {
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        released++;
      }),
    );
    return Fx.concat(Fx.succeed("first"), Fx.never);
  });
  expect(
    await Effect.runPromise(View.pipe(Fx.take(1), Fx.collectAll, Scope.provide(parent))),
  ).toEqual(["first"]);
  expect(released).toBe(1);
  await Effect.runPromise(Scope.close(parent, Exit.void));
  expect(released).toBe(1);
});

it("allocates a new child for every subscription to the same zero-argument Fx", async () => {
  const parent = Scope.makeUnsafe();
  const scopes: Scope.Scope[] = [];
  const View = component(function* () {
    scopes.push(yield* Scope.Scope);
    return Fx.never;
  });
  const program = View.pipe(Fx.drain, Scope.provide(parent));
  expect(scopes).toEqual([]);
  const first = Effect.runFork(program);
  const second = Effect.runFork(program);
  try {
    await vi.waitFor(() => expect(scopes).toHaveLength(2));
    expect(scopes[0]).not.toBe(scopes[1]);
    expect(scopes.every((scope) => scope !== parent)).toBe(true);
  } finally {
    await Effect.runPromise(Fiber.interrupt(first));
    await Effect.runPromise(Fiber.interrupt(second));
    await Effect.runPromise(Scope.close(parent, Exit.void));
  }
});

it("keeps a stateless template's listeners and refs after its first DOM emission", async () => {
  const window = new Window() as unknown as globalThis.Window & typeof globalThis;
  const parent = Scope.makeUnsafe();
  let clicks = 0;
  let acquired = 0;
  let released = 0;
  let completed = false;
  // Deliberately no setup effects: stateless templates still retain their mounted lifetime.
  // oxlint-disable-next-line require-yield
  const View = component(function* () {
    return html`<button
      ref=${() =>
        Effect.gen(function* () {
          acquired++;
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              released++;
            }),
          );
        })}
      @click=${Effect.sync(() => {
        clicks++;
      })}
    >
      Stateless
    </button>`;
  });
  const fiber = Effect.runFork(
    render(View, window.document.body).pipe(
      Fx.provide(DomRenderTemplate.using(window.document)),
      Fx.drain,
      Effect.ensuring(
        Effect.sync(() => {
          completed = true;
        }),
      ),
      Scope.provide(parent),
    ),
  );
  try {
    await vi.waitFor(() => expect(window.document.querySelector("button")).not.toBeNull());
    await vi.waitFor(() => expect(acquired).toBe(1));
    const button = window.document.querySelector("button")!;
    button.click();
    await vi.waitFor(() => expect(clicks).toBe(1));
    button.click();
    await vi.waitFor(() => expect(clicks).toBe(2));
    expect(completed).toBe(false);
    expect(released).toBe(0);
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(completed).toBe(true);
    expect(released).toBe(1);
    button.click();
    expect(clicks).toBe(2);
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
    await Effect.runPromise(Scope.close(parent, Exit.void));
  }
});

it("releases a switched-out stateful component without disabling its replacement", async () => {
  const window = new Window() as unknown as globalThis.Window & typeof globalThis;
  const parent = Scope.makeUnsafe();
  const selected = await Effect.runPromise(RefSubject.make("first").pipe(Scope.provide(parent)));
  const released: string[] = [];
  const View = component(function* (name: string) {
    const count = yield* RefSubject.make(0);
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        released.push(name);
      }),
    );
    return html`<button @click=${RefSubject.update(count, (n) => n + 1)}>${name}:${count}</button>`;
  });
  const fiber = Effect.runFork(
    render(Fx.switchMap(selected, View), window.document.body).pipe(
      Fx.provide(DomRenderTemplate.using(window.document)),
      Fx.drain,
      Scope.provide(parent),
    ),
  );
  try {
    await vi.waitFor(() => expect(window.document.body.textContent).toBe("first:0"));
    const first = window.document.querySelector("button")!;
    first.click();
    await vi.waitFor(() => expect(first.textContent).toBe("first:1"));
    await Effect.runPromise(RefSubject.set(selected, "second"));
    await vi.waitFor(() => expect(window.document.body.textContent).toBe("second:0"));
    expect(released).toEqual(["first"]);
    const second = window.document.querySelector("button")!;
    first.click();
    expect(first.textContent).toBe("first:1");
    second.click();
    await vi.waitFor(() => expect(second.textContent).toBe("second:1"));
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(released).toEqual(["first", "second"]);
    second.click();
    expect(second.textContent).toBe("second:1");
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
    await Effect.runPromise(Scope.close(parent, Exit.void));
  }
});
