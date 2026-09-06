import * as Data from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Cause from "effect/Cause";
import type * as Context from "effect/Context";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import {
  computed,
  getCurrentInstance,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  onServerPrefetch,
  shallowReadonly,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type WritableComputedRef,
} from "vue";
import { useAsyncData, type AsyncDataView } from "./AsyncData.js";
import { useRuntime, type VueRuntime } from "./Runtime.js";
import { sourceFx } from "./internal/source.js";
import { useScopedRunner } from "./internal/scope.js";

export type ReactiveSource<A, E = never, R = never> =
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx.Fx<A, E, R>;

export interface ReactiveOptions<A, E, R, ER = never> {
  readonly runtime?: MaybeRefOrGetter<VueRuntime<R, ER>>;
  /** A transferred snapshot is authoritative during SSR and the first hydration render. */
  readonly initial?: Data.AsyncData<A, E | ER>;
  /** Skip automatic execution (including SSR); refresh explicitly when ready. */
  readonly immediate?: boolean;
  readonly onCause?: (cause: Cause.Cause<E | ER>) => void;
}

export interface AsyncState<A, E> extends AsyncDataView<A, E> {
  readonly refresh: () => Promise<void>;
  readonly cancel: () => void;
}

/** A request-local first snapshot for seeding SSR and client hydration with identical data. */
export function prefetch<A, E, R>(
  source: ReactiveSource<A, E, R>,
): Effect.Effect<Data.AsyncData<A, E>, never, Exclude<R, Scope.Scope>> {
  return Effect.scoped(Fx.first(sourceFx(source))).pipe(
    Effect.matchCause({
      onFailure: Data.failure,
      onSuccess: (first): Data.AsyncData<A, E> =>
        Option.isSome(first) ? Data.success(first.value) : Data.NoData,
    }),
  );
}

/** Observe a Typed AsyncData source directly, preserving its loading and optimistic states. */
export function useAsyncDataSource<A, E, E2, R, ER = never>(
  source: MaybeRefOrGetter<ReactiveSource<Data.AsyncData<A, E>, E2, R | Scope.Scope>>,
  options: Omit<ReactiveOptions<Data.AsyncData<A, E>, E2, R, ER>, "initial"> & {
    readonly initial?: Data.AsyncData<A, E>;
  } = {},
): AsyncState<A, E | E2 | ER> {
  const state = useSource(source, {
    ...options,
    initial: options.initial === undefined ? undefined : Data.success(options.initial),
  });
  const data = computed(() =>
    Data.flatMap(state.data.value, (inner, outer) =>
      Data.isRefreshing(outer) ? Data.startLoading(inner) : inner,
    ),
  );
  return { ...useAsyncData(data), refresh: state.refresh, cancel: state.cancel };
}

/** One scoped subscription engine for Effect, Stream, Fx, and service-backed sources. */
function useSource<A, E, R, ER = never>(
  source: MaybeRefOrGetter<ReactiveSource<A, E, R | Scope.Scope>>,
  options: ReactiveOptions<A, E, R, ER> = {},
): AsyncState<A, E | ER> {
  if (!getCurrentScope())
    throw new Error("Typed composables must run inside Vue setup or an effect scope");

  const runtime = options.runtime ?? useRuntime<R, ER>();
  const data = shallowRef<Data.AsyncData<A, E | ER>>(options.initial ?? Data.NoData);
  const view = useAsyncData(shallowReadonly(data));

  type Snapshot = {
    readonly source: ReactiveSource<A, E, R | Scope.Scope>;
    readonly runtime: VueRuntime<R, ER>;
  };
  type Request =
    | { readonly _tag: "replace"; readonly snapshot: Snapshot }
    | {
        readonly _tag: "refresh";
        readonly snapshot: Snapshot;
        readonly done: Deferred.Deferred<void>;
      }
    | { readonly _tag: "cancel" };

  let emit: Fx.Emit<Request> | undefined;
  let stopped = false;

  const settle = () => {
    data.value = Data.isLoading(data.value) ? Data.NoData : Data.stopLoading(data.value);
  };

  const changes = Fx.callback<Request>((next) => {
    emit = next;

    const stop = watch(
      [() => readSource(source), () => toValue(runtime)],
      ([currentSource, currentRuntime]) => {
        if (options.immediate === false) settle();
        next.succeed({
          _tag: "replace",
          snapshot: { source: currentSource, runtime: currentRuntime },
        });
      },
      { flush: "sync", immediate: true },
    );

    return Effect.sync(() => {
      stop();
      emit = undefined;
    });
  });

  const requests = changes.pipe(
    Fx.skipRepeatsWith(
      (left, right) =>
        left._tag === "replace" &&
        right._tag === "replace" &&
        left.snapshot.source === right.snapshot.source &&
        left.snapshot.runtime === right.snapshot.runtime,
    ),
  );

  const runRequest = (request: Request) =>
    Effect.suspend(() => {
      if (request._tag === "cancel") {
        settle();
        return Effect.void;
      }

      const currentSource = readSource(source);
      const currentRuntime = toValue(runtime);
      const snapshot = request.snapshot;

      if (
        snapshot.source !== currentSource ||
        snapshot.runtime !== currentRuntime ||
        (request._tag === "replace" && options.immediate === false)
      ) {
        if (request._tag === "refresh") return Deferred.succeed(request.done, undefined);
        return Effect.sync(settle);
      }

      data.value = Data.startLoading(data.value);

      const settleRefresh =
        request._tag === "refresh" ? Deferred.succeed(request.done, undefined) : Effect.void;

      const program = sourceFx(snapshot.source).pipe(
        Fx.map(Data.success),
        Fx.tap((value) =>
          Effect.sync(() => (data.value = value)).pipe(Effect.andThen(settleRefresh)),
        ),
        Fx.drain,
        Effect.andThen(Effect.sync(settle)),
        Effect.andThen(settleRefresh),
        Layer.effectDiscard,
        Layer.launch,
      );

      const completed = Effect.acquireUseRelease(
        Effect.sync(() => snapshot.runtime.runFork(program)),
        Fiber.join,
        Fiber.interrupt,
      ).pipe(
        Effect.catchCause((cause) =>
          Effect.sync(() => {
            if (Cause.hasInterruptsOnly(cause)) return;
            data.value = Data.failure(cause);
            options.onCause?.(cause);
          }),
        ),
      );

      return Effect.ensuring(completed, settleRefresh);
    });

  const lifecycle = requests.pipe(Fx.switchMapEffect(runRequest));
  let running: Fiber.Fiber<void, never> | undefined;
  const startClient = () => {
    if (running) return;
    running = Effect.runFork(Effect.scoped(Fx.drain(lifecycle)));
  };

  const refresh = (): Promise<void> => {
    const done = Deferred.makeUnsafe<void>();
    const currentEmit = emit;

    if (!currentEmit || stopped) return Promise.resolve();

    const currentSource = readSource(source);
    const currentRuntime = toValue(runtime);
    const delivery = currentEmit.succeed({
      _tag: "refresh",
      snapshot: { source: currentSource, runtime: currentRuntime },
      done,
    });
    return Effect.runPromise(
      Fiber.await(delivery).pipe(Effect.andThen(Deferred.await(done)), Effect.ignoreCause),
    );
  };

  const cancel = () => {
    settle();
    emit?.succeed({ _tag: "cancel" });
  };

  if (getCurrentInstance()) {
    onServerPrefetch(async () => {
      if (options.immediate === false || options.initial !== undefined) return;

      const currentRuntime = toValue(runtime);
      const currentSource = readSource(source);
      const exit = await currentRuntime.runPromiseExit(
        Effect.scoped(Fx.first(sourceFx(currentSource))),
      );

      if (Exit.isSuccess(exit)) {
        if (Option.isSome(exit.value)) data.value = Data.success(exit.value.value);
      } else {
        data.value = Data.failure(exit.cause);
        options.onCause?.(exit.cause);
      }
    });

    onMounted(startClient);
  } else {
    startClient();
  }

  onScopeDispose(() => {
    stopped = true;
    if (running) Effect.runFork(Fiber.interrupt(running));
  });

  return { ...view, refresh, cancel };
}

export function useEffect<A, E, R, ER = never>(
  source: MaybeRefOrGetter<Effect.Effect<A, E, R | Scope.Scope>>,
  options: ReactiveOptions<A, E, R, ER> = {},
) {
  return useSource(source, options);
}

export function useStream<A, E, R, ER = never>(
  source: MaybeRefOrGetter<Stream.Stream<A, E, R | Scope.Scope>>,
  options: ReactiveOptions<A, E, R, ER> = {},
) {
  return useSource(source, options);
}

export function useFx<A, E, R, ER = never>(
  source: MaybeRefOrGetter<Fx.Fx<A, E, R | Scope.Scope>>,
  options: ReactiveOptions<A, E, R, ER> = {},
) {
  return useSource(source, options);
}

export function useService<I, S, ER = never>(
  service: Context.Key<I, S>,
  options: ReactiveOptions<S, never, I, ER> = {},
) {
  return useEffect(service, options);
}

// Class-style Context services are callable JavaScript values AND Effects, never getters.
function readSource<A, E, R>(
  source: MaybeRefOrGetter<ReactiveSource<A, E, R>>,
): ReactiveSource<A, E, R> {
  return Effect.isEffect(source) || Fx.isFx(source) || Stream.isStream(source)
    ? source
    : toValue(source);
}

export interface RefSubjectState<A, E> extends AsyncState<A, E> {
  readonly current: WritableComputedRef<A | undefined, A>;
  readonly set: (value: A) => Promise<Exit.Exit<A, E>>;
  readonly update: (f: (value: A) => A) => Promise<Exit.Exit<A, E>>;
}

/** Observe a RefSubject and write through its Effect update path in the Vue scope. */
export function useRefSubject<A, E, R, ER = never>(
  subject: MaybeRefOrGetter<RefSubject.RefSubject<A, E, R | Scope.Scope>>,
  options: ReactiveOptions<A, E, R, ER> = {},
): RefSubjectState<A, E | ER> {
  const runtime = options.runtime ?? useRuntime<R, ER>();
  const state = useFx(subject, { ...options, runtime });
  const run = useScopedRunner(runtime, [() => toValue(subject)]);

  const set = (value: A) => run(RefSubject.set(toValue(subject), value), options.onCause);
  const update = (f: (value: A) => A) =>
    run(RefSubject.update(toValue(subject), f), options.onCause);

  const current = computed({
    get: () => Option.getOrUndefined(state.value.value),
    set: (value: A) => {
      void set(value);
    },
  });

  return { ...state, current, set, update };
}
