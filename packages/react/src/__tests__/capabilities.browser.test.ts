import * as ManagedRuntime from "effect/ManagedRuntime";
import { act, Component, createElement, StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Cause, Context, Deferred, Effect, Exit, Layer, Option, Scope, Stream } from "effect";
import * as Data from "@typed/async-data";
import { Fx, RefSubject } from "@typed/fx";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider, fromContext, useService } from "../Runtime.js";
import {
  prefetch,
  useAction,
  useAsyncData,
  useEffect,
  useFx,
  useRefSubject,
  useStream,
  type ActionState,
  type AsyncState,
  type RefSubjectState,
} from "../Hooks.js";

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
const eventually = async (check: () => void) => act(() => vi.waitFor(check));
class Label extends Context.Service<Label, { readonly value: string }>()("test/ReactLabel") {}

describe("React reactive lifecycle", () => {
  it("refreshes the latest action with the previous invocation's arguments", async () => {
    const calls: string[] = [];
    const first = (value: number) =>
      Effect.sync(() => {
        calls.push(`first:${value}`);
        return value + 1;
      });
    const second = (value: number) =>
      Effect.sync(() => {
        calls.push(`second:${value}`);
        return value + 10;
      });
    let state!: ActionState<[number], number, never>;
    const App = ({ action }: { action: typeof first }) => {
      state = useAction(action);
      return null;
    };

    await mount(createElement(App, { action: first }));
    await act(() => state.run(3));
    expect(state.latest).toEqual(Option.some(4));

    await act(() => root!.render(createElement(App, { action: second })));
    await act(() => state.refresh());
    await eventually(() => expect(state.latest).toEqual(Option.some(13)));
    expect(calls).toEqual(["first:3", "second:3"]);
  });

  it("releases StrictMode subscriptions and cancels replaced sources", async () => {
    let acquired = 0,
      released = 0;
    const source = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(Effect.andThen(Effect.never));
    function App({ effect }: { effect: Effect.Effect<unknown, never, Scope.Scope> }) {
      return createElement("p", null, useEffect(effect).data._tag);
    }
    await mount(createElement(StrictMode, null, createElement(App, { effect: source })));
    await eventually(() => expect(acquired - released).toBe(1));
    await act(() =>
      root!.render(
        createElement(StrictMode, null, createElement(App, { effect: Effect.succeed("ready") })),
      ),
    );
    await eventually(() => expect(host.textContent).toBe("Success"));
    expect(acquired).toBe(released);
  });

  it("retains Stream values and full failure causes", async () => {
    const source = Stream.concat(Stream.make(1, 2), Stream.fail("offline"));
    let state!: AsyncState<number, string>;
    const App = () => {
      state = useStream(source);
      return createElement("p", null, state.error.pipe(Option.getOrElse(() => "waiting")));
    };
    await mount(createElement(App));
    await eventually(() => expect(host.textContent).toBe("offline"));
    expect(state.latest).toEqual(Option.some(2));
    expect(state.failure).toBe(true);
    expect(Option.isSome(state.cause)).toBe(true);
  });

  it("updates real RefSubjects transactionally and detaches on unmount", async () => {
    const scope = Scope.makeUnsafe();
    const ref = await Effect.runPromise(
      RefSubject.make(1).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    let state!: RefSubjectState<number, never>;
    const App = () => {
      state = useRefSubject(ref);
      return createElement("p", null, state.value.pipe(Option.getOrElse(() => 0)));
    };
    await mount(createElement(App));
    await eventually(() => expect(host.textContent).toBe("1"));
    await act(() => state.update((value) => value + 2));
    expect(host.textContent).toBe("3");
    await act(async () => {
      expect(Exit.isSuccess(await state.set(9))).toBe(true);
    });
    expect(host.textContent).toBe("9");
    await act(() => root!.unmount());
    root = undefined;
    expect(Exit.isFailure(await state.set(10))).toBe(true);
    expect(await Effect.runPromise(ref)).toBe(9);
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });

  it("shows refreshing states, preserves failure and cancels action work", async () => {
    let released = 0;
    const deferred = Deferred.makeUnsafe<number, string>();
    let state!: ActionState<[], number, string>;
    const action = () =>
      Effect.acquireRelease(Effect.void, () =>
        Effect.sync(() => {
          released++;
        }),
      ).pipe(Effect.andThen(Deferred.await(deferred)));
    const App = () => {
      state = useAction(action, { initial: Data.success(5) });
      return createElement(
        "p",
        null,
        `${state.refreshing}:${state.value.pipe(Option.getOrElse(() => 0))}`,
      );
    };
    await mount(createElement(App));
    let pending!: Promise<Exit.Exit<number, string>>;
    await act(() => {
      pending = state.run();
    });
    expect(host.textContent).toBe("true:5");
    await act(() => state.cancel());
    expect(Exit.isFailure(await pending)).toBe(true);
    await eventually(() => expect(released).toBe(1));
    expect(state.refreshing).toBe(false);
    await act(() => {
      pending = state.run();
    });
    await act(() => Effect.runPromise(Deferred.fail(deferred, "rejected")));
    await pending;
    await eventually(() => expect(state.error).toEqual(Option.some("rejected")));
    expect(state.latest).toEqual(Option.some(5));
  });

  it("interrupts action work when its component unmounts", async () => {
    let released = false;
    const action = () =>
      Effect.acquireRelease(Effect.void, () =>
        Effect.sync(() => {
          released = true;
        }),
      ).pipe(Effect.andThen(Effect.never));
    let state!: ActionState<[], never, never>;
    const App = () => {
      state = useAction(action);
      return null;
    };
    await mount(createElement(App));
    let pending!: Promise<Exit.Exit<never, never>>;
    await act(() => {
      pending = state.run();
    });
    await act(() => root!.unmount());
    root = undefined;
    expect(Exit.isFailure(await pending)).toBe(true);
    await eventually(() => expect(released).toBe(true));
    expect(Exit.isFailure(await state.run())).toBe(true);
  });

  it("preserves emitted AsyncData loading, refresh, optimistic and failure states", async () => {
    const scope = Scope.makeUnsafe();
    const ref = await Effect.runPromise(
      RefSubject.make<Data.AsyncData<number, string>>(Data.loading()).pipe(
        Effect.provideService(Scope.Scope, scope),
      ),
    );
    let state!: AsyncState<number, string>;
    const App = () => {
      state = useAsyncData(ref);
      return null;
    };
    await mount(createElement(App));
    await eventually(() => expect(state.loading).toBe(true));
    await act(() => Effect.runPromise(RefSubject.set(ref, Data.startLoading(Data.success(8)))));
    expect(state.refreshing).toBe(true);
    expect(state.value).toEqual(Option.some(8));
    await act(() => Effect.runPromise(RefSubject.set(ref, Data.optimistic(Data.success(8), 9))));
    expect(state.value).toEqual(Option.some(9));
    await act(() => Effect.runPromise(RefSubject.set(ref, Data.failure(Cause.fail("failed")))));
    expect(state.error).toEqual(Option.some("failed"));
    expect(state.latest).toEqual(Option.some(9));
    await act(() => root!.unmount());
    root = undefined;
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });

  it("resubscribes when service context is replaced without disposing borrowed runtimes", async () => {
    const source = Effect.map(Label, ({ value }) => value);
    const one = fromContext(Context.make(Label, { value: "one" }));
    const two = fromContext(Context.make(Label, { value: "two" }));
    const App = () => {
      const state = useEffect(source);
      return createElement("p", null, state.value.pipe(Option.getOrElse(() => "pending")));
    };
    await mount(createElement(Provider<Label>, { runtime: one }, createElement(App)));
    await eventually(() => expect(host.textContent).toBe("one"));
    await act(() =>
      root!.render(createElement(Provider<Label>, { runtime: two }, createElement(App))),
    );
    await eventually(() => expect(host.textContent).toBe("two"));
    expect(await one.runPromise(Label)).toEqual({ value: "one" });
  });

  it("acquires owned layers after commit and releases each StrictMode acquisition", async () => {
    let acquired = 0,
      released = 0;
    const layer = Layer.effect(
      Label,
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return { value: "layer" };
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const App = () => createElement("p", null, useService(Label).value);
    await mount(
      createElement(
        StrictMode,
        null,
        createElement(Provider<Label>, { layer }, createElement(App)),
      ),
    );
    await eventually(() => expect(host.textContent).toBe("layer"));
    expect(acquired - released).toBe(1);
    await act(() => root!.unmount());
    root = undefined;
    await eventually(() => expect(acquired).toBe(released));
  });

  it("hydrates a prefetched initial snapshot without starting its producer on the server", async () => {
    let acquired = 0,
      released = 0;
    const source = Fx.fromEffect(
      Effect.acquireRelease(
        Effect.sync(() => ++acquired),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const initial = await Effect.runPromise(prefetch(source));
    expect(acquired).toBe(1);
    expect(released).toBe(1);
    const App = () => {
      const state = useFx(source, { initial });
      return createElement("p", null, state.value.pipe(Option.getOrElse(() => 0)));
    };
    const html = renderToString(createElement(App));
    expect(html).toBe("<p>1</p>");
    expect(acquired).toBe(1);
    host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = html;
    const errors: unknown[] = [];
    await act(() => {
      root = hydrateRoot(host, createElement(App), {
        onRecoverableError: (error) => {
          errors.push(error);
        },
      });
    });
    await eventually(() => expect(host.textContent).toBe("2"));
    expect(errors).toEqual([]);
    expect(released).toBe(2);
  });
  it("cancels a pending borrowed context wait without disposing its owner", async () => {
    let waiting = false,
      stopped = false;
    const runtime = {
      ...fromContext(Context.empty()),
      cachedContext: undefined,
      contextEffect: Effect.scoped(
        Effect.acquireRelease(
          Effect.sync(() => {
            waiting = true;
          }),
          () =>
            Effect.sync(() => {
              stopped = true;
            }),
        ).pipe(Effect.andThen(Effect.never)),
      ),
    };
    await mount(createElement(Provider<never>, { runtime, fallback: "loading" }, "ready"));
    await eventually(() => expect(waiting).toBe(true));
    expect(host.textContent).toBe("loading");
    await act(() => root!.unmount());
    root = undefined;
    await eventually(() => expect(stopped).toBe(true));
    expect(await runtime.runPromise(Effect.succeed("still usable"))).toBe("still usable");
  });

  it("keeps an owned Layer alive when only its error callback changes", async () => {
    let acquired = 0,
      released = 0;
    const layer = Layer.effect(
      Label,
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return { value: "ready" };
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const App = () => createElement("p", null, useService(Label).value);
    await mount(createElement(Provider<Label>, { layer, onError: () => {} }, createElement(App)));
    await eventually(() => expect(host.textContent).toBe("ready"));
    await act(() =>
      root!.render(
        createElement(Provider<Label>, { layer, onError: () => {} }, createElement(App)),
      ),
    );
    expect(acquired).toBe(1);
    expect(released).toBe(0);
  });

  it("preserves a finite source's emitted loading state after its subscription completes", async () => {
    const source = Fx.succeed(Data.loading());
    let state!: AsyncState<never, never>;
    const App = () => {
      state = useAsyncData(source);
      return null;
    };
    await mount(createElement(App));
    expect(state.loading).toBe(true);
    expect(state.data._tag).toBe("Loading");
  });

  it("keeps concurrent RefSubject transactions instead of cancelling earlier writes", async () => {
    const scope = Scope.makeUnsafe();
    const initial = Deferred.makeUnsafe<number>();
    const ref = await Effect.runPromise(
      RefSubject.make(Deferred.await(initial)).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    let state!: RefSubjectState<number, never>;
    const App = () => {
      state = useRefSubject(ref);
      return null;
    };
    await mount(createElement(App));
    let first!: Promise<Exit.Exit<number>>, second!: Promise<Exit.Exit<number>>;
    await act(() => {
      first = state.update((n) => n + 1);
      second = state.update((n) => n + 1);
    });
    await act(() => Effect.runPromise(Deferred.succeed(initial, 0)));
    expect(Exit.isSuccess(await first)).toBe(true);
    expect(Exit.isSuccess(await second)).toBe(true);
    expect(await Effect.runPromise(ref)).toBe(2);
    await act(() => root!.unmount());
    root = undefined;
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });

  it("cancels old RefSubject writes when replacing the subject and rejects saved stale writers", async () => {
    const scope = Scope.makeUnsafe();
    const gate = Deferred.makeUnsafe<number>();
    const first = await Effect.runPromise(
      RefSubject.make(Deferred.await(gate)).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    const second = await Effect.runPromise(
      RefSubject.make(20).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    let state!: RefSubjectState<number, never>;
    const App = ({ source }: { source: RefSubject.RefSubject<number> }) => {
      state = useRefSubject(source);
      return null;
    };
    await mount(createElement(App, { source: first }));
    const saved = state;
    let pending!: Promise<Exit.Exit<number>>;
    await act(() => {
      pending = state.update((n) => n + 1);
    });
    await act(() => root!.render(createElement(App, { source: second })));
    expect(Exit.isFailure(await pending)).toBe(true);
    expect(Exit.isFailure(await saved.set(99))).toBe(true);
    await act(() => state.update((n) => n + 2));
    expect(await Effect.runPromise(second)).toBe(22);
    await act(() => root!.unmount());
    root = undefined;
    await Effect.runPromise(Scope.close(scope, Exit.void));
  });
  it("keeps Context overrides attached to the borrowed ManagedRuntime lifetime", async () => {
    let acquired = false,
      released = false;
    const runtime = ManagedRuntime.make(Layer.empty);
    await runtime.context();
    const context = Context.make(Label, { value: "override" });
    const source = Effect.acquireRelease(
      Effect.sync(() => {
        acquired = true;
      }),
      () =>
        Effect.sync(() => {
          released = true;
        }),
    ).pipe(Effect.andThen(Effect.never));
    const App = () => {
      useEffect(source);
      return createElement("p", null, useService(Label).value);
    };
    await mount(
      createElement(Provider<never, never, Label>, { runtime, context }, createElement(App)),
    );
    await eventually(() => expect(acquired).toBe(true));
    expect(host.textContent).toBe("override");
    await act(() => runtime.dispose());
    await eventually(() => expect(released).toBe(true));
  });
  it("surfaces unhandled provider acquisition failures to the nearest React error boundary", async () => {
    class Boundary extends Component<{ children?: ReactNode }, { error: unknown }> {
      override state = { error: undefined as unknown };
      static getDerivedStateFromError(error: unknown) {
        return { error };
      }
      override render() {
        return this.state.error ? "failed" : this.props.children;
      }
    }
    const caught: unknown[] = [];
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host, {
      onCaughtError: (error) => {
        caught.push(error);
      },
    });
    await act(() =>
      root!.render(
        createElement(
          Boundary,
          null,
          createElement(
            Provider<never, string>,
            { layer: Layer.effectDiscard(Effect.fail("unavailable")), fallback: "loading" },
            "ready",
          ),
        ),
      ),
    );
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(host.textContent).toBe("failed");
    });
    const failure = caught[0] as Error & { cause: Cause.Cause<string> };
    expect(Data.getError(Data.failure(failure.cause))).toEqual(Option.some("unavailable"));
  });
});
