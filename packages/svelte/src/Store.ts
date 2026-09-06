import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import type { Readable } from "svelte/store";
import { writable } from "svelte/store";

/**
 * Exposes a non-failing Fx as a Svelte readable store. Its subscription belongs
 * to the current Effect Scope. Svelte stores have no error channel; handle
 * failures in the Fx before converting, or use the AsyncData integration.
 */
export const toReadable = Effect.fn(function* <A, R>(source: Fx.Fx<A, never, R>, initial: A) {
  const store = writable(initial);
  yield* Fx.observe(source, store.set).pipe(Effect.forkScoped);

  return { subscribe: store.subscribe };
});

/** Converts a Svelte readable into an Fx, unsubscribing on interruption. */
export function fromReadable<A>(store: Readable<A>): Fx.Fx<A> {
  return Fx.callback<A>((emit) => {
    const unsubscribe = store.subscribe((value) => emit.succeed(value));
    return Effect.sync(unsubscribe);
  });
}

/**
 * Exposes a non-failing RefSubject as a writable Svelte store. Writes are
 * synchronous for Svelte subscribers and applied to the RefSubject in the
 * captured Effect context. Both observation and writes belong to the current
 * Scope. After it closes, set/update are inert.
 */
export const toWritable = Effect.fn(function* <A, R>(ref: RefSubject.RefSubject<A, never, R>) {
  let current = yield* ref;
  let closed = false;
  const store = writable(current);

  const services = yield* Effect.context<R>();
  const scope = yield* Effect.scope;
  const runFork = Effect.runForkWith(services);

  yield* Effect.addFinalizer(() =>
    Effect.sync(() => {
      closed = true;
    }),
  );

  yield* Fx.observe(ref, (value) => {
    current = value;
    store.set(value);
  }).pipe(Effect.forkScoped);

  const set = (value: A): void => {
    if (closed) return;

    current = value;
    store.set(value);
    runFork(RefSubject.set(ref, value), { onFiberStart: Fiber.runIn(scope) });
  };

  return {
    subscribe: store.subscribe,
    set,
    update: (f: (value: A) => A) => {
      if (!closed) set(f(current));
    },
  };
});
