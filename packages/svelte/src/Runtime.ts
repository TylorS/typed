import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as ManagedRuntime from "effect/ManagedRuntime";
import { getContext, setContext } from "svelte";
import { derived, readable, type Readable } from "svelte/store";

/** A borrowed execution boundary. ManagedRuntime implements this contract. */
export type Runtime<R, ER = never> = Pick<
  ManagedRuntime.ManagedRuntime<R, ER>,
  "runFork" | "runPromise" | "runPromiseExit" | "runSync" | "contextEffect"
>;

export type RuntimeSource<R, ER = never> = Runtime<R, ER> | Readable<Runtime<R, ER>>;

const key = Symbol.for("@typed/svelte/Runtime");

export function asReadable<A>(value: A | Readable<A>): Readable<A> {
  return value !== null && typeof value === "object" && "subscribe" in value
    ? (value as Readable<A>)
    : readable(value as A);
}

/** Carries an existing Effect context into Svelte without acquiring a Layer. */
export function fromContext<R>(services: Context.Context<R>): Runtime<R> {
  return {
    contextEffect: Effect.succeed(services),
    runFork: Effect.runForkWith(services),
    runPromise: Effect.runPromiseWith(services),
    runPromiseExit: Effect.runPromiseExitWith(services),
    runSync: Effect.runSyncWith(services),
  };
}

const fallbackRuntime = readable(fromContext(Context.empty()));

/** Produces a native Svelte mount/render context map. */
export function runtimeContext<R, ER>(runtime: RuntimeSource<R, ER>): Map<unknown, unknown> {
  return new Map([[key, asReadable(runtime)]]);
}

/** Call during component initialization; the caller retains runtime ownership. */
export function provideRuntime<R, ER>(runtime: RuntimeSource<R, ER>): Readable<Runtime<R, ER>> {
  return setContext(key, asReadable(runtime));
}

/** Optional lookup used by framework adapters during component initialization. */
export function getRuntime<R = never, ER = never>(): Readable<Runtime<R, ER>> | undefined {
  return getContext(key);
}

/** Reads the closest runtime provider. Its store follows runtime replacements. */
export function useRuntime<R = never, ER = never>(): Readable<Runtime<R, ER>> {
  // Context lookup is the boundary where a native component declares its
  // required services. Absent application services fail through Effect normally.
  return getRuntime<R, ER>() ?? (fallbackRuntime as unknown as Readable<Runtime<R, ER>>);
}

/** Shadows services while keeping the parent's remaining services and lifetime. */
export function withServices<R, ER, R2>(
  runtime: Runtime<R, ER>,
  services: Context.Context<R2>,
): Runtime<R | R2, ER> {
  return {
    contextEffect: Effect.map(runtime.contextEffect, (parent) => Context.merge(parent, services)),
    runFork: (effect, options) => runtime.runFork(Effect.provideContext(effect, services), options),
    runPromise: (effect, options) =>
      runtime.runPromise(Effect.provideContext(effect, services), options),
    runPromiseExit: (effect, options) =>
      runtime.runPromiseExit(Effect.provideContext(effect, services), options),
    runSync: (effect) => runtime.runSync(Effect.provideContext(effect, services)),
  };
}

/** Provides reactive service overrides to this component's descendants. */
export function provideServices<R2, R = never, ER = never>(
  services: Context.Context<R2> | Readable<Context.Context<R2>>,
  runtime: RuntimeSource<R, ER> = useRuntime<R, ER>(),
): Readable<Runtime<R | R2, ER>> {
  return provideRuntime(
    derived([asReadable(runtime), asReadable(services)], ([parent, context]) =>
      withServices(parent, context),
    ),
  );
}
