import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Context, Deferred, Effect, Exit, Layer, ManagedRuntime, Scope } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAction, useEffect, type ActionState, type AsyncState } from "../Hooks.js";
import { fromContext, type Runtime } from "../Runtime.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (root) await act(() => root?.unmount());
  root = undefined;
  host?.remove();
});
const mount = async (element: ReturnType<typeof createElement>) => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(() => root!.render(element));
};
const check = (assertion: () => void) =>
  vi.waitFor(async () => {
    await act(async () => {});
    assertion();
  });
function heldSource(name: string, events: string[], released: Deferred.Deferred<void>) {
  return Effect.acquireRelease(
    Effect.sync(() => {
      events.push(`${name} open`);
    }),
    () =>
      Effect.sync(() => {
        events.push(`${name} closing`);
      }).pipe(
        Effect.andThen(Deferred.await(released)),
        Effect.andThen(
          Effect.sync(() => {
            events.push(`${name} closed`);
          }),
        ),
      ),
  ).pipe(Effect.andThen(Effect.never));
}

describe("React hook replacement ordering", () => {
  it("waits for asynchronous cleanup before refreshing a subscription", async () => {
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const source = heldSource("source", events, released);
    let state!: AsyncState<never, never>;
    const App = () => {
      state = useEffect(source);
      return null;
    };
    try {
      await mount(createElement(App));
      await check(() => expect(events).toEqual(["source open"]));
      await act(() => state.refresh());
      await check(() => expect(events).toContain("source closing"));
      expect(events).toEqual(["source open", "source closing"]);
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await check(() =>
        expect(events).toEqual(["source open", "source closing", "source closed", "source open"]),
      );
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
    }
  });

  it("keeps the original cleanup barrier when a queued source is superseded", async () => {
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const a = heldSource("A", events, released);
    const b = Effect.sync(() => {
      events.push("B open");
    });
    const c = Effect.sync(() => {
      events.push("C open");
    });
    const App = ({ source }: { source: Effect.Effect<unknown, never, Scope.Scope> }) => {
      useEffect(source);
      return null;
    };
    try {
      await mount(createElement(App, { source: a }));
      await check(() => expect(events).toEqual(["A open"]));
      await act(() => root!.render(createElement(App, { source: b })));
      await check(() => expect(events).toContain("A closing"));
      await act(() => root!.render(createElement(App, { source: c })));
      expect(events).toEqual(["A open", "A closing"]);
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await check(() => expect(events).toEqual(["A open", "A closing", "A closed", "C open"]));
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
    }
  });

  it("serializes runtime replacements and skips a queued runtime's acquisition", async () => {
    class Name extends Context.Service<Name, string>()("test/ReplacementName") {}
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const a = fromContext(Context.make(Name, "A"));
    const b = ManagedRuntime.make(
      Layer.effect(
        Name,
        Effect.sync(() => {
          events.push("B acquired");
          return "B";
        }),
      ),
    );
    const c = fromContext(Context.make(Name, "C"));
    const source = Effect.flatMap(Name, (name) =>
      name === "A"
        ? heldSource(name, events, released)
        : Effect.sync(() => {
            events.push(`${name} open`);
          }),
    );
    const App = ({ runtime }: { runtime: Runtime<Name> }) => {
      useEffect(source, { runtime });
      return null;
    };
    try {
      await mount(createElement(App, { runtime: a }));
      await check(() => expect(events).toEqual(["A open"]));
      await act(() => root!.render(createElement(App, { runtime: b })));
      await check(() => expect(events).toContain("A closing"));
      await act(() => root!.render(createElement(App, { runtime: c })));
      expect(events).toEqual(["A open", "A closing"]);
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await check(() => expect(events).toEqual(["A open", "A closing", "A closed", "C open"]));
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
      await b.dispose();
    }
  });

  it("settles superseded action calls after cleanup without running the queued action", async () => {
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const action = (name: string) =>
      name === "A"
        ? heldSource(name, events, released)
        : Effect.sync(() => {
            events.push(`${name} open`);
          });
    let state!: ActionState<[string], void, never>;
    const App = () => {
      state = useAction(action);
      return null;
    };
    try {
      await mount(createElement(App));
      let first!: Promise<Exit.Exit<void>>,
        second!: Promise<Exit.Exit<void>>,
        third!: Promise<Exit.Exit<void>>;
      await act(() => {
        first = state.run("A");
      });
      await check(() => expect(events).toEqual(["A open"]));
      await act(() => {
        second = state.run("B");
      });
      await check(() => expect(events).toContain("A closing"));
      await act(() => {
        third = state.run("C");
      });
      expect(events).toEqual(["A open", "A closing"]);
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await act(async () => {
        expect(Exit.isFailure(await first)).toBe(true);
        expect(Exit.isFailure(await second)).toBe(true);
        expect(Exit.isSuccess(await third)).toBe(true);
      });
      expect(events).toEqual(["A open", "A closing", "A closed", "C open"]);
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
    }
  });

  it("keeps StrictMode's replacement subscription behind its first cleanup", async () => {
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const source = heldSource("strict", events, released);
    const App = () => {
      useEffect(source);
      return null;
    };
    try {
      await mount(createElement(StrictMode, null, createElement(App)));
      await check(() => expect(events).toContain("strict closing"));
      expect(events).toEqual(["strict open", "strict closing"]);
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await check(() =>
        expect(events).toEqual(["strict open", "strict closing", "strict closed", "strict open"]),
      );
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
    }
  });
  it("never starts a cancelled producer after its borrowed runtime finishes preparing", async () => {
    class Name extends Context.Service<Name, string>()("test/PendingRuntimeName") {}
    const events: string[] = [];
    const prepared = Deferred.makeUnsafe<void>();
    const slow = ManagedRuntime.make(
      Layer.effect(
        Name,
        Effect.sync(() => {
          events.push("preparing");
        }).pipe(
          Effect.andThen(Deferred.await(prepared)),
          Effect.andThen(
            Effect.sync(() => {
              events.push("prepared");
              return "old";
            }),
          ),
        ),
      ),
    );
    const fast = fromContext(Context.make(Name, "new"));
    const source = Effect.flatMap(Name, (name) =>
      Effect.sync(() => {
        events.push(`${name} source`);
      }),
    );
    const App = ({ runtime }: { runtime: Runtime<Name> }) => {
      useEffect(source, { runtime });
      return null;
    };
    try {
      await mount(createElement(App, { runtime: slow }));
      await check(() => expect(events).toEqual(["preparing"]));
      await act(() => root!.render(createElement(App, { runtime: fast })));
      await check(() => expect(events).toEqual(["preparing", "new source"]));
      await act(() => Effect.runPromise(Deferred.succeed(prepared, undefined)));
      await check(() => expect(events).toEqual(["preparing", "new source", "prepared"]));
      expect(await slow.runPromise(Name)).toBe("old");
      expect(events).not.toContain("old source");
    } finally {
      await Effect.runPromise(Deferred.succeed(prepared, undefined));
      await slow.dispose();
    }
  });

  it("does not start a queued replacement after unmount", async () => {
    const events: string[] = [];
    const released = Deferred.makeUnsafe<void>();
    const a = heldSource("A", events, released);
    const b = Effect.sync(() => {
      events.push("B open");
    });
    const App = ({ source }: { source: Effect.Effect<unknown, never, Scope.Scope> }) => {
      useEffect(source);
      return null;
    };
    try {
      await mount(createElement(App, { source: a }));
      await check(() => expect(events).toEqual(["A open"]));
      await act(() => root!.render(createElement(App, { source: b })));
      await check(() => expect(events).toEqual(["A open", "A closing"]));
      await act(() => root!.unmount());
      root = undefined;
      await act(() => Effect.runPromise(Deferred.succeed(released, undefined)));
      await check(() => expect(events).toEqual(["A open", "A closing", "A closed"]));
    } finally {
      await Effect.runPromise(Deferred.succeed(released, undefined));
    }
  });
});
