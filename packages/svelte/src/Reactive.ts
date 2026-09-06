import * as AsyncData from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Cause from "effect/Cause";
import type * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import { onMount } from "svelte";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { asyncState, type AsyncState } from "./AsyncData.js";
import { asReadable, useRuntime, type Runtime, type RuntimeSource } from "./Runtime.js";
import { toFx, type Source } from "./Source.js";

export interface SourceOptions<A, E, R, ER = never> {
  readonly runtime?: RuntimeSource<Exclude<R, Scope.Scope>, ER>;
  /** Used synchronously during SSR and the client's first render. */
  readonly initial?: AsyncData.AsyncData<A, E | ER>;
}

/**
 * Resolves a request-local first snapshot and closes its subscription scope.
 * Pass the result as `initial` to both server rendering and client hydration.
 * Empty sources yield NoData; failure causes become AsyncData failures.
 */
export const prefetch = Effect.fn(function <A, E = never, R = never>(
  source: Source<A, E, R>,
): Effect.Effect<AsyncData.AsyncData<A, E>, never, Exclude<R, Scope.Scope>> {
  return Fx.first(toFx(source)).pipe(
    Effect.scoped,
    Effect.matchCause({
      onFailure: AsyncData.failure,
      onSuccess: Option.match({ onNone: () => AsyncData.NoData, onSome: AsyncData.success }),
    }),
  );
});

/**
 * Observes an Effect, Stream, Fx, or value after mount. A Svelte source store or
 * runtime store can replace the producer; the previous scope closes first.
 * Server rendering reads only `initial`, and never starts application effects.
 */
export function useSource<A, E = never, R = never, ER = never>(
  source: Source<A, E, R> | Readable<Source<A, E, R>>,
  options: SourceOptions<A, E, R, ER> = {},
): AsyncState<A, E | ER> {
  const runtime = options.runtime
    ? asReadable(options.runtime)
    : useRuntime<Exclude<R, Scope.Scope>, ER>();
  const sources = asReadable(source);
  const data = writable<AsyncData.AsyncData<A, E | ER>>(options.initial ?? AsyncData.NoData);

  let mounted = false;
  let running: Fiber.Fiber<void, E | ER> | undefined;
  let refreshCurrent: (() => void) | undefined;
  let cancelCurrent: (() => void) | undefined;

  const settle = () => data.update(AsyncData.stopLoading);

  const cancel = () => {
    if (mounted) cancelCurrent?.();
    else running?.interruptUnsafe();
    settle();
  };

  const refresh = () => {
    if (mounted) refreshCurrent?.();
  };

  const state = asyncState(data, { refresh, cancel });

  onMount(() => {
    mounted = true;
    const snapshots = derived([runtime, sources], ([currentRuntime, currentSource]) => ({
      runtime: currentRuntime,
      source: currentSource,
    }));
    const changes = Fx.callback<
      | {
          readonly _tag: "replace";
          readonly snapshot: {
            runtime: Runtime<Exclude<R, Scope.Scope>, ER>;
            source: Source<A, E, R>;
          };
        }
      | { readonly _tag: "refresh" }
      | { readonly _tag: "cancel" }
    >((emit) => {
      const stopSnapshots = snapshots.subscribe((snapshot) =>
        emit.succeed({ _tag: "replace", snapshot }),
      );
      refreshCurrent = () => void emit.succeed({ _tag: "refresh" });
      cancelCurrent = () => void emit.succeed({ _tag: "cancel" });

      return Effect.sync(() => {
        stopSnapshots();
        refreshCurrent = undefined;
        cancelCurrent = undefined;
      });
    });

    const requests = changes.pipe(
      Fx.skipRepeatsWith(
        (left, right) =>
          left._tag === "replace" &&
          right._tag === "replace" &&
          left.snapshot.runtime === right.snapshot.runtime &&
          left.snapshot.source === right.snapshot.source,
      ),
    );
    const lifecycle = Fx.switchMapEffect(requests, (request) =>
      Effect.suspend(() => {
        if (request._tag === "cancel") return Effect.void;

        const currentRuntime = get(runtime);
        const currentSource = get(sources);

        if (
          request._tag === "replace" &&
          (request.snapshot.runtime !== currentRuntime || request.snapshot.source !== currentSource)
        )
          return Effect.void;

        data.update(AsyncData.startLoading);

        return Effect.acquireUseRelease(
          Effect.sync(() =>
            currentRuntime.runFork(
              toFx(currentSource).pipe(
                Fx.map(AsyncData.success),
                Fx.observe((value) => data.set(value)),
                Effect.andThen(Effect.sync(settle)),
                Layer.effectDiscard,
                Layer.launch,
              ),
            ),
          ),
          Fiber.join,
          Fiber.interrupt,
        ).pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => {
              if (mounted && !Cause.hasInterruptsOnly(cause)) data.set(AsyncData.failure(cause));
            }),
          ),
        );
      }),
    );

    running = Effect.runFork(Effect.scoped(Fx.drain(lifecycle)));

    return () => {
      mounted = false;
      cancel();
    };
  });

  return state;
}

/** Observes an existing AsyncData producer without nesting its state model. */
export function useAsyncData<A, E, E2 = never, R = never, ER = never>(
  source:
    | Source<AsyncData.AsyncData<A, E>, E2, R>
    | Readable<Source<AsyncData.AsyncData<A, E>, E2, R>>,
  options: SourceOptions<A, E | E2, R, ER> = {},
): AsyncState<A, E | E2 | ER> {
  const outer = useSource<AsyncData.AsyncData<A, E | E2 | ER>, E2, R, ER>(source, {
    runtime: options.runtime,
    initial: AsyncData.success(options.initial ?? AsyncData.NoData),
  });

  const data = derived(outer.data, (state) =>
    AsyncData.flatMap(state, (value, outer) =>
      AsyncData.isPending(outer) ? AsyncData.startLoading(value) : value,
    ),
  );
  const state = asyncState(data, { refresh: outer.refresh, cancel: outer.cancel });
  onMount(() => state.data.subscribe(() => {}));

  return state;
}

/** Reads any Effect service using the same runtime, SSR, and failure contract. */
export function useService<I, A, ER = never>(
  service: Context.Service<I, A>,
  options: SourceOptions<A, never, I, ER> = {},
): AsyncState<A, ER> {
  return useSource(Effect.service(service), options);
}

/** A native writable whose transactional writes settle with typed Exit results. */
export interface RefSubjectStore<A, E> extends Writable<A> {
  readonly state: AsyncState<A, E>;
  readonly set: (value: A) => Promise<Exit.Exit<A, E>>;
  readonly update: (f: (value: A) => A) => Promise<Exit.Exit<A, E>>;
}

/**
 * Observes any RefSubject, including hydrated refs with typed failures. Writes
 * use its serialized transactions; failures also reach `state` when a native
 * binding ignores the returned Exit. Unmount/runtime replacement cancels writes.
 */
export function useRefSubject<A, E = never, R = never, ER = never>(
  ref: RefSubject.RefSubject<A, E, R>,
  initial: A,
  options: Omit<SourceOptions<A, E, R, ER>, "initial"> = {},
): RefSubjectStore<A, E | ER> {
  const runtime = options.runtime
    ? asReadable(options.runtime)
    : useRuntime<Exclude<R, Scope.Scope>, ER>();
  const observed = useSource(ref, { runtime, initial: AsyncData.success(initial) });
  const values = writable(initial);
  const result = writable<AsyncData.AsyncData<A, E | ER> | undefined>(undefined);

  let writes = Scope.makeUnsafe("parallel");
  let active = false;
  let revision = 0;

  const abort = () => {
    revision++;
    Effect.runFork(Scope.close(writes, Exit.interrupt()));
    if (active) writes = Scope.makeUnsafe("parallel");
  };

  const state = asyncState(
    derived([observed.data, result], ([data, written]) => written ?? data),
    {
      refresh: () => {
        result.set(undefined);
        observed.refresh();
      },
      cancel: () => {
        abort();
        observed.cancel();
      },
    },
  );

  onMount(() => {
    active = true;
    const stopRuntime = runtime.subscribe(abort);
    const stopSource = observed.data.subscribe((data) => {
      result.set(undefined);
      const value = AsyncData.getSuccess(data);
      if (Option.isSome(value)) values.set(value.value);
    });
    const track = state.data.subscribe(() => {});

    return () => {
      active = false;
      abort();
      stopRuntime();
      stopSource();
      track();
    };
  });

  const run = async (effect: Effect.Effect<A, E, R>): Promise<Exit.Exit<A, E | ER>> => {
    if (!active) return Exit.interrupt();

    const token = ++revision;
    const exit = await get(runtime).runPromiseExit(Effect.scoped(effect), {
      onFiberStart: Fiber.runIn(writes),
    });

    if (active && token === revision) {
      if (Exit.isSuccess(exit)) {
        values.set(exit.value);
        if (AsyncData.isFailure(get(observed.data))) observed.refresh();
      }
      result.set(AsyncData.fromExit(exit));
    }

    return exit;
  };

  return {
    subscribe: values.subscribe,
    set: (value) => run(RefSubject.set(ref, value)),
    update: (f) => run(RefSubject.update(ref, f)),
    state,
  };
}
