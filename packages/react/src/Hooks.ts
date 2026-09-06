import { useEffect as useReactEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as Data from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Subject from "@typed/fx/Subject";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Fiber from "effect/Fiber";
import type * as Stream from "effect/Stream";
import { asyncDataView, type AsyncDataView } from "./AsyncData.js";
import { useRuntime, type Runtime } from "./Runtime.js";
import { sourceFx } from "./internal/source.js";

export interface AsyncState<A, E> extends AsyncDataView<A, E> {
  /** Re-runs the current source, retaining the last value while refreshing. */
  readonly refresh: () => void;
  readonly cancel: () => void;
}

export interface ReactiveOptions<A, E, R = never, ER = never> {
  readonly runtime?: Runtime<Exclude<R, Scope.Scope>, ER>;
  /** Serialized identically for SSR and hydration. Defaults to NoData; never evaluates the source on the server. */
  readonly initial?: Data.AsyncData<A, E | ER>;
  /** Defer the first execution until refresh. */
  readonly immediate?: boolean;
}

type Snapshot<A, E> = { readonly data: Data.AsyncData<A, E>; readonly latest: Option.Option<A> };

type Input<A, E, R, ER, Args extends ReadonlyArray<unknown>> =
  | {
      readonly _tag: "source";
      readonly runtime: Runtime<Exclude<R, Scope.Scope>, ER>;
      readonly source: Fx.Fx<Data.AsyncData<A, E | ER>, E, Exclude<R, Scope.Scope>>;
      readonly immediate: boolean;
    }
  | {
      readonly _tag: "action";
      readonly runtime: Runtime<Exclude<R, Scope.Scope>, ER>;
      readonly action: (...args: Args) => Effect.Effect<A, E, Exclude<R, Scope.Scope>>;
    };

type Request<A, E, ER> = {
  readonly fx: Fx.Fx<unknown>;
  readonly reply?: (exit: Exit.Exit<A, E | ER>) => void;
};

function makeStore<A, E, R, ER, Args extends ReadonlyArray<unknown> = never>(
  initial: Data.AsyncData<A, E | ER>,
) {
  const server: Snapshot<A, E | ER> = { data: initial, latest: Data.getSuccess(initial) };
  let snapshot = server;
  const listeners = new Set<() => void>();
  // The request stream is replayed once so a request admitted during React's
  // commit scheduling cannot be lost before the observer fiber is running.
  const requests = Subject.unsafeMake<Request<A, E, ER>>(1);
  let lifecycle: Fiber.Fiber<unknown, never> | undefined;
  let closing: Promise<void> | undefined;
  let input: Input<A, E, R, ER, Args> | undefined;
  let args: Args | undefined;
  let latestRequest: Request<A, E, ER> | undefined;
  const pendingReplies = new Set<(exit: Exit.Exit<A, E | ER>) => void>();

  const publish = (data: Data.AsyncData<A, E | ER>): Effect.Effect<void> =>
    Effect.sync(() => {
      const value = Data.getSuccess(data);
      snapshot = { data, latest: Option.isSome(value) ? value : snapshot.latest };
      for (const listener of listeners) listener();
    });

  const requestFor = (
    next: Input<A, E, R, ER, Args>,
    nextArgs?: Args,
    reply?: (exit: Exit.Exit<A, E | ER>) => void,
  ): Request<A, E, ER> => {
    const settle = (exit: Exit.Exit<A, E | ER>) => {
      if (reply && pendingReplies.delete(reply)) {
        reply(exit);
      }
    };
    if (next._tag === "action" && nextArgs === undefined) return { fx: Fx.empty };

    Effect.runSync(publish(Data.startLoading(snapshot.data)));

    if (next._tag === "source") {
      const source = next.source.pipe(
        Fx.onExit((exit) =>
          Exit.isSuccess(exit) ? publish(Data.stopLoading(snapshot.data)) : Effect.void,
        ),
        Fx.mapEffect((data) => publish(data).pipe(Effect.as(data))),
        Fx.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Fx.empty
            : Fx.fromEffect(publish(Data.failure(cause)).pipe(Effect.as(Data.failure(cause)))),
        ),
      );
      const work = Fx.fromEffect(
        Effect.acquireUseRelease(
          Effect.sync(() => next.runtime.runFork(Effect.scoped(Fx.drain(source)))),
          Fiber.join,
          Fiber.interrupt,
        ),
      ).pipe(
        Fx.catchCause((cause) =>
          Cause.hasInterruptsOnly(cause)
            ? Fx.empty
            : Fx.fromEffect(publish(Data.failure(cause)).pipe(Effect.as(Data.failure(cause)))),
        ),
      );
      return { fx: work };
    }

    const actionArgs = nextArgs;
    if (actionArgs === undefined) return { fx: Fx.empty };

    const action = Effect.exit(
      Effect.scoped(
        Effect.onExit(
          Effect.suspend(() => next.action(...actionArgs)),
          (exit) =>
            Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause)
              ? Effect.sync(() => settle(Exit.interrupt()))
              : Effect.void,
        ),
      ),
    );
    const work = Fx.fromEffect(
      Effect.acquireUseRelease(
        Effect.sync(() => next.runtime.runFork(action)),
        Fiber.join,
        Fiber.interrupt,
      ),
    ).pipe(
      Fx.mapEffect((exit) => {
        const data = Exit.isSuccess(exit) ? Data.success(exit.value) : Data.failure(exit.cause);
        return publish(data).pipe(Effect.andThen(Effect.sync(() => settle(exit))), Effect.as(data));
      }),
      Fx.catchCause((cause) => {
        return Cause.hasInterruptsOnly(cause)
          ? Fx.empty
          : Fx.fromEffect(
              publish(Data.failure(cause)).pipe(
                Effect.andThen(Effect.sync(() => settle(Exit.failCause(cause)))),
                Effect.as(Data.failure(cause)),
              ),
            );
      }),
      Fx.onInterrupt(() => Effect.sync(() => settle(Exit.interrupt()))),
    );
    return { fx: work, reply };
  };

  const workflow = requests.pipe(
    Fx.switchMap((request) => {
      if (latestRequest !== request) {
        if (request.reply) {
          pendingReplies.delete(request.reply);
          request.reply(Exit.interrupt());
        }
        return Fx.empty;
      }

      return Fx.suspend(() => {
        if (latestRequest !== request) {
          if (request.reply) {
            pendingReplies.delete(request.reply);
            request.reply(Exit.interrupt());
          }
          return Fx.empty;
        }
        return request.fx;
      });
    }),
  );

  const start = () => {
    const run = () => {
      if (!listeners.size || lifecycle) return;
      lifecycle = Effect.runFork(Effect.scoped(Fx.drain(workflow)));
      const currentInput = input;
      if (
        latestRequest === undefined &&
        currentInput &&
        currentInput._tag === "source" &&
        currentInput.immediate
      )
        dispatch(requestFor(currentInput), true);
    };
    if (closing) void closing.then(run);
    else run();
  };

  const stop = () => {
    latestRequest = undefined;
    const current = lifecycle;
    lifecycle = undefined;
    if (current) {
      const replies = Array.from(pendingReplies);
      const done = Effect.runPromise(Fiber.interrupt(current)).then(() => {
        for (const reply of replies) {
          if (pendingReplies.delete(reply)) reply(Exit.interrupt());
        }
        return Effect.runPromise(requests.interrupt);
      });
      closing = done;
      void done.then(() => {
        if (closing === done) closing = undefined;
      });
    }
  };

  const dispatch = (request: Request<A, E, ER>, sync = false) => {
    if (!listeners.size) return;
    latestRequest = request;
    if (request.reply) pendingReplies.add(request.reply);
    if (sync) Effect.runSync(requests.onSuccess(request));
    else void Effect.runPromise(requests.onSuccess(request));
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) start();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) stop();
      };
    },
    configure(next: Input<A, E, R, ER, Args>) {
      input = next;
      if (listeners.size && next._tag === "source") {
        dispatch(
          next.immediate
            ? requestFor(next)
            : { fx: Fx.fromEffect(publish(Data.stopLoading(snapshot.data))) },
        );
      }
    },
    refresh() {
      if (input) dispatch(requestFor(input, args));
    },
    cancel() {
      const data = Data.isLoading(snapshot.data) ? Data.NoData : Data.stopLoading(snapshot.data);
      dispatch({ fx: Fx.fromEffect(publish(data).pipe(Effect.as(data))) });
    },
    run(...callArgs: Args): Promise<Exit.Exit<A, E | ER>> {
      if (!listeners.size) return Promise.resolve(Exit.interrupt());
      if (input?._tag !== "action") return Promise.resolve(Exit.interrupt());
      const action = input;
      args = callArgs;
      return new Promise((resolve) => {
        dispatch(requestFor(action, callArgs, resolve));
      });
    },
  };
}

function useDataSource<A, E, R, ER>(
  source: Fx.Fx<Data.AsyncData<A, E | ER>, E, R>,
  options: ReactiveOptions<A, E, R, ER>,
): AsyncState<A, E | ER> {
  const runtime = useRuntime(options.runtime);
  const store = useRef<ReturnType<typeof makeStore<A, E, R, ER>> | undefined>(undefined);
  if (store.current === undefined) store.current = makeStore(options.initial ?? Data.NoData);

  useReactEffect(() => {
    store.current?.configure({
      _tag: "source",
      runtime,
      source: Fx.unwrapScoped(Effect.succeed(source)),
      immediate: options.immediate ?? true,
    });
  }, [runtime, source, options.immediate]);

  const snapshot = useSyncExternalStore(
    store.current.subscribe,
    store.current.getSnapshot,
    store.current.getServerSnapshot,
  );

  return useMemo(
    () => ({
      ...asyncDataView(snapshot.data, snapshot.latest),
      refresh: store.current!.refresh,
      cancel: store.current!.cancel,
    }),
    [snapshot],
  );
}

function useSource<A, E, R, ER>(
  source: Fx.Fx<A, E, R>,
  options: ReactiveOptions<A, E, R, ER>,
): AsyncState<A, E | ER> {
  const data = useMemo(() => Fx.map(source, Data.success), [source]);

  return useDataSource(data, options);
}

/** Observes an Effect after commit. Memoize source expressions whose identity should survive rerenders. */
export function useEffect<A, E, R, ER = never>(
  effect: Effect.Effect<A, E, R>,
  options: ReactiveOptions<A, E, R, ER> = {},
): AsyncState<A, E | ER> {
  const source = useMemo(() => Fx.fromEffect(effect), [effect]);

  return useSource(source, options);
}

/** Observes an Effect Stream, retaining its latest successful emission and complete failure cause. */
export function useStream<A, E, R, ER = never>(
  stream: Stream.Stream<A, E, R>,
  options: ReactiveOptions<A, E, R, ER> = {},
): AsyncState<A, E | ER> {
  const source = useMemo(() => Fx.fromStream(stream), [stream]);

  return useSource(source, options);
}

/** Observes a Typed Fx. Unmount, source changes and runtime changes interrupt the previous subscription. */
export function useFx<A, E, R, ER = never>(
  source: Fx.Fx<A, E, R>,
  options: ReactiveOptions<A, E, R, ER> = {},
): AsyncState<A, E | ER> {
  return useSource(source, options);
}

export interface RefSubjectState<A, E> extends AsyncState<A, E> {
  readonly set: (value: A) => Promise<Exit.Exit<A, E>>;
  readonly update: (f: (value: A) => A) => Promise<Exit.Exit<A, E>>;
}

/** Observes existing Typed state and exposes transactional writes with typed Exit results. */
export function useRefSubject<A, E, R, ER = never>(
  ref: RefSubject.RefSubject<A, E, R>,
  options: ReactiveOptions<A, E, R | Scope.Scope, ER> = {},
): RefSubjectState<A, E | ER> {
  const state = useFx<A, E, R | Scope.Scope, ER>(ref, options);
  const runtime = useRuntime(options.runtime);

  const writes = useMemo(() => {
    let scope: Scope.Closeable | undefined;

    const run = (effect: Effect.Effect<A, E, R>): Promise<Exit.Exit<A, E | ER>> => {
      if (!scope) return Promise.resolve(Exit.interrupt());
      return runtime.runPromiseExit(Effect.scoped(effect), { onFiberStart: Fiber.runIn(scope) });
    };

    return {
      mount() {
        const current = Scope.makeUnsafe();
        scope = current;
        return () => {
          scope = undefined;
          void Effect.runPromiseExit(Scope.close(current, Exit.void));
        };
      },
      set: (value: A) => run(RefSubject.set(ref, value)),
      update: (f: (value: A) => A) => run(RefSubject.update(ref, f)),
    };
  }, [ref, runtime]);

  useReactEffect(writes.mount, [writes]);

  return useMemo(() => ({ ...state, set: writes.set, update: writes.update }), [state, writes]);
}

export interface ActionState<Args extends ReadonlyArray<unknown>, A, E> extends AsyncState<A, E> {
  /** Latest invocation wins; starting another command interrupts the previous one. All calls settle with Exit. */
  readonly run: (...args: Args) => Promise<Exit.Exit<A, E>>;
}

/** Event-driven Effects with refresh status, typed failures, cancellation and unmount cleanup. */
export function useAction<Args extends ReadonlyArray<unknown>, A, E, R, ER = never>(
  action: (...args: Args) => Effect.Effect<A, E, R>,
  options: Omit<ReactiveOptions<A, E, R, ER>, "immediate"> = {},
): ActionState<Args, A, E | ER> {
  const runtime = useRuntime(options.runtime);
  const store = useRef<ReturnType<typeof makeStore<A, E, R, ER, Args>> | undefined>(undefined);
  if (store.current === undefined)
    store.current = makeStore<A, E, R, ER, Args>(options.initial ?? Data.NoData);

  useReactEffect(() => {
    store.current?.configure({
      _tag: "action",
      runtime,
      action: (...args) => Effect.scoped(action(...args)),
    });
  }, [runtime, action]);

  const snapshot = useSyncExternalStore(
    store.current.subscribe,
    store.current.getSnapshot,
    store.current.getServerSnapshot,
  );

  const run = store.current.run;

  return useMemo(
    () => ({
      ...asyncDataView(snapshot.data, snapshot.latest),
      refresh: store.current!.refresh,
      cancel: store.current!.cancel,
      run,
    }),
    [snapshot, run],
  );
}

/** Flattens an Fx of AsyncData, preserving both its state and any source/runtime failures. */
export function useAsyncData<A, E, E2, R, ER = never>(
  source: Fx.Fx<Data.AsyncData<A, E>, E2, R>,
  options: ReactiveOptions<A, E | E2, R, ER> = {},
): AsyncState<A, E | E2 | ER> {
  return useDataSource<A, E | E2, R, ER>(source, options);
}

/** Captures the first value for SSR/hydration and closes the temporary subscription before returning. */
export function prefetch<A, E, R>(
  source: Effect.Effect<A, E, R> | Stream.Stream<A, E, R> | Fx.Fx<A, E, R>,
): Effect.Effect<Data.AsyncData<A, E>, never, Exclude<R, Scope.Scope>> {
  const fx = sourceFx(source);

  return Effect.map(Effect.exit(Effect.scoped(Fx.first(fx))), (exit) =>
    Exit.isFailure(exit)
      ? Data.failure(exit.cause)
      : Option.match(exit.value, { onNone: () => Data.NoData, onSome: Data.success }),
  );
}
