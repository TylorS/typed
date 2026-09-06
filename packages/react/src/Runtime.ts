import {
  Suspense,
  use,
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
  type ReactElement,
} from "react";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";
import type * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { cachedResource } from "./internal/resource.js";

/** A provider acquisition failure passed to React error boundaries when no onError handler is supplied. */
export class RuntimeProviderError<E> extends Error {
  readonly _tag = "RuntimeProviderError";
  constructor(override readonly cause: Cause.Cause<E>) {
    super("Effect runtime preparation failed", { cause });
  }
}

/** Execution capabilities shared by a ManagedRuntime and a borrowed Effect Context. */
export type Runtime<R = never, ER = never> = Pick<
  ManagedRuntime.ManagedRuntime<R, ER>,
  | "runFork"
  | "runSync"
  | "runSyncExit"
  | "runCallback"
  | "runPromise"
  | "runPromiseExit"
  | "context"
  | "contextEffect"
  | "cachedContext"
>;

/** Borrows already-built services. It acquires no resources and never closes the owner's Scope. */
export function fromContext<R>(context: Context.Context<R>): Runtime<R> {
  return {
    cachedContext: context,
    context: () => Promise.resolve(context),
    contextEffect: Effect.succeed(context),
    runFork: Effect.runForkWith(context),
    runSync: Effect.runSyncWith(context),
    runSyncExit: Effect.runSyncExitWith(context),
    runCallback: Effect.runCallbackWith(context),
    runPromise: Effect.runPromiseWith(context),
    runPromiseExit: Effect.runPromiseExitWith(context),
  };
}

function withServices<R, ER, S>(
  runtime: Runtime<R, ER>,
  context: Context.Context<R | S>,
): Runtime<R | S, ER> {
  const provide = <A, E>(effect: Effect.Effect<A, E, R | S>) =>
    Effect.provideContext(effect, context);

  return {
    cachedContext: context,
    context: () => Promise.resolve(context),
    contextEffect: Effect.succeed(context),
    runFork: (effect, options) => runtime.runFork(provide(effect), options),
    runSync: (effect) => runtime.runSync(provide(effect)),
    runSyncExit: (effect) => runtime.runSyncExit(provide(effect)),
    runCallback: (effect, options) => runtime.runCallback(provide(effect), options),
    runPromise: (effect, options) => runtime.runPromise(provide(effect), options),
    runPromiseExit: (effect, options) => runtime.runPromiseExit(provide(effect), options),
  };
}

const emptyRuntime = fromContext<never>(Context.empty());

// React context erases the environment at its boundary; public execution APIs retain R and ER.
const RuntimeContext = createContext<Runtime<any, any>>(emptyRuntime as any);

/** Resolves an explicit runtime before the closest Provider. Ambient requirements are checked at runtime. */
export function useRuntime<R = never, ER = never>(runtime?: Runtime<R, ER>): Runtime<R, ER> {
  const inherited = useContext(RuntimeContext);

  return runtime ?? inherited;
}

/** Reads an already-prepared service without executing an Effect during React render. */
export function useService<I, S>(tag: Context.Key<I, S>): S {
  const runtime = useContext(RuntimeContext);
  const context = runtime.cachedContext;
  if (!context) throw new Error("React Effect services require a prepared Provider context");

  return Context.get(context, tag);
}

export interface ProviderProps<R = never, ER = never, Services = never> {
  /** Borrowed runtime. The caller owns its disposal. */
  readonly runtime?: Runtime<R, ER>;
  /** Already-built services merged over the parent or explicit runtime. Safe for SSR. */
  readonly context?: Context.Context<Services>;
  /** Provider-owned Layer. Acquisition starts after commit; cleanup disposes its runtime. */
  readonly layer?: Layer.Layer<R, ER>;
  readonly fallback?: ReactNode;
  /** Handles acquisition failures; without a handler they reach the nearest React error boundary. */
  readonly onError?: (cause: Cause.Cause<ER>) => void;
  readonly children?: ReactNode;
}

/** Provides Effect services to all React descendants, including nested Typed rendering. */
export function Provider<R = never, ER = never, Services = never>(
  props: ProviderProps<R, ER, Services>,
): ReactNode {
  if (props.layer && props.runtime) throw new Error("Provider accepts either layer or runtime");

  return props.layer
    ? createElement(
        OwnedProvider<R, ER, Services>,
        props as ProviderProps<R, ER, Services> & { layer: Layer.Layer<R, ER> },
      )
    : createElement(BorrowedProvider<R, ER, Services>, props);
}

export const RuntimeProvider = Provider;

function BorrowedProvider<R, ER, Services>(props: ProviderProps<R, ER, Services>): ReactNode {
  const runtime = useRuntime(props.runtime);
  const errorHandler = useRef(props.onError);
  errorHandler.current = props.onError;

  // Borrowed runtimes own their acquisition. Cache only this Provider's read,
  // above its Suspense boundary; never dispose or globally cache the runtime.
  const resource = useMemo(() => {
    const cached = cachedResource<Exit.Exit<Context.Context<R>, ER>>((signal) =>
      Effect.runPromiseExit(runtime.contextEffect, { signal }).then((exit) => {
        if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause))
          errorHandler.current?.(exit.cause);

        return exit;
      }),
    );

    return { ...cached, context: runtime.cachedContext };
  }, [runtime]);

  useEffect(() => resource.retain(), [resource]);

  return useMemo(() => {
    const child = createElement(PreparedProvider<R, ER, Services>, {
      ...props,
      runtime,
      read: resource.read,
      preparedContext: resource.context,
    });

    // A captured Context is already prepared on both server and client. Avoid
    // adding a hydration boundary around native React islands in that case.
    return props.context !== undefined && props.runtime === undefined
      ? child
      : createElement(Suspense, { fallback: props.fallback ?? null }, child);
  }, [
    runtime,
    resource,
    props.runtime,
    props.context,
    props.fallback,
    props.onError,
    props.children,
  ]);
}

function PreparedProvider<R, ER, Services>({
  runtime,
  read,
  preparedContext,
  context,
  fallback = null,
  onError,
  children,
}: ProviderProps<R, ER, Services> & {
  readonly runtime: Runtime<R, ER>;
  readonly read: () => Promise<Exit.Exit<Context.Context<R>, ER>>;
  readonly preparedContext: Context.Context<R> | undefined;
}): ReactNode {
  const result = preparedContext ? Exit.succeed(preparedContext) : use(read());
  const available = Exit.isSuccess(result) ? result.value : undefined;

  const provided = useMemo(() => {
    if (!available) return undefined;

    // Preserve execution ownership and expose prepared services synchronously.
    if (context) return withServices(runtime, Context.merge(available, context));
    return runtime.cachedContext ? runtime : withServices(runtime, available);
  }, [runtime, available, context]);

  if (Exit.isFailure(result) && !onError) throw new RuntimeProviderError(result.cause);

  return provided
    ? createElement(RuntimeContext.Provider, { value: provided }, children)
    : fallback;
}

function OwnedProvider<R, ER, Services>(
  props: ProviderProps<R, ER, Services> & { layer: Layer.Layer<R, ER> },
): ReactNode {
  const { layer, onError } = props;
  const errorHandler = useRef(onError);
  errorHandler.current = onError;

  const liveRuntime = useRef<Runtime<R, ER> | undefined>(undefined);
  const [owned, setOwned] = useState<
    { layer: Layer.Layer<R, ER>; runtime: Runtime<R, ER> } | undefined
  >(undefined);
  const [failure, setFailure] = useState<
    | { layer: Layer.Layer<R, ER>; runtime: Runtime<R, ER>; error: RuntimeProviderError<ER> }
    | undefined
  >(undefined);

  useEffect(() => {
    const runtime = ManagedRuntime.make(layer);
    liveRuntime.current = runtime;
    let active = true;

    const cancel = Effect.runCallback(runtime.contextEffect, {
      onExit(exit) {
        if (!active) return;
        if (Exit.isSuccess(exit)) setOwned({ layer, runtime });
        else if (errorHandler.current) errorHandler.current(exit.cause);
        else setFailure({ layer, runtime, error: new RuntimeProviderError(exit.cause) });
      },
    });

    return () => {
      active = false;
      liveRuntime.current = undefined;
      cancel();
      void runtime.dispose();
    };
  }, [layer]);

  if (!onError && failure?.layer === layer && failure.runtime === liveRuntime.current)
    throw failure.error;

  return owned?.layer === layer && owned.runtime === liveRuntime.current
    ? createElement(BorrowedProvider<R, ER, Services>, {
        ...props,
        runtime: owned.runtime,
        layer: undefined,
      })
    : (props.fallback ?? null);
}

/** A typed React Provider/hook pair for any Effect service key. */
export function serviceContext<I, S>(
  tag: Context.Key<I, S>,
): {
  readonly Provider: (props: { readonly value: S; readonly children?: ReactNode }) => ReactElement;
  readonly use: () => S;
} {
  return {
    Provider({ value, children }) {
      const context = useMemo(() => Context.make(tag, value), [value]);

      return createElement(Provider<never, never, I>, { context }, children);
    },
    use: () => useService(tag),
  };
}
