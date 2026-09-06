import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Sink from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Runs multiple Fx streams concurrently while draining their values in argument order.
 *
 * @remarks
 * ## Why
 *
 * `mergeOrdered` overlaps production latency while preserving the same output
 * grouping as sequential concatenation. It is useful only when that ordering is
 * worth retaining later results in memory.
 *
 * ## Concurrency, ordering, and buffering
 *
 * Every input starts immediately. Input zero forwards as it produces. Values
 * from each later input are buffered until every earlier input ends, then drained
 * in that input's emission order before the next buffer is released. Buffering
 * is unbounded: a fast or infinite later input can retain arbitrary values while
 * an earlier input remains open.
 *
 * ## Ownership and lifetime
 *
 * Non-interruption failures are forwarded. Interrupt-only causes mark that input
 * ended so they cannot deadlock later buffers. All input services remain typed.
 * The observing fiber owns all runs and buffers; completion waits for all inputs,
 * while interruption discards buffers and interrupts remaining resource scopes.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const ordered = Fx.mergeOrdered(
 *   Fx.at("slow first", "20 millis"),
 *   Fx.at("fast second", "1 millis")
 * )
 * Effect.runPromise(Fx.collectAll(ordered)).then(console.log)
 * // ["slow first", "fast second"]: the second value waits in its buffer
 * ```
 *
 * @param fx - The Fx streams to merge.
 * @returns An `Fx` that emits values in order.
 * @since 1.0.0
 * @category Combining sources
 */
export function mergeOrdered<FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fx: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>> {
  return make<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>>(
    Effect.fn(function* (sink) {
      const { makeSink, onEnd, discard } = withBuffers(fx.length, sink);
      const run = Effect.forEach(
        fx,
        (fx, i) => Effect.onExit(fx.run(makeSink(i)), () => onEnd(i)),
        {
          concurrency: "unbounded",
          discard: true,
        },
      );

      yield* Effect.acquireUseRelease(
        run.pipe(Effect.forkChild({ startImmediately: true })),
        Fiber.join,
        (fiber) => discard.pipe(Effect.andThen(Fiber.interrupt(fiber))),
      );
    }),
  );
}

function withBuffers<A, E, R>(size: number, sink: Sink.Sink<A, E, R>) {
  const buffers = indexedBuffers(size, sink);
  const onSuccess = (index: number, value: A) => buffers.get(index)!.onSuccess(value);
  const onEnd = (index: number) => buffers.get(index)!.onEnd;
  const discard = Effect.sync(() => {
    for (const buffer of buffers.values()) buffer.discard();
  });

  const makeSink = (index: number) =>
    Sink.make<A, E, R>(
      (cause) => (Cause.hasInterruptsOnly(cause) ? onEnd(index) : sink.onFailure(cause)),
      (value) => onSuccess(index, value),
    );

  return {
    onSuccess,
    onEnd,
    discard,
    makeSink,
  } as const;
}

function indexedBuffers<A, E, R>(size: number, sink: Sink.Sink<A, E, R>) {
  const buffers = new Map<number, ReturnType<typeof IndexedBuffer<A, E, R>>>();

  const last = size - 1;
  for (let i = 0; i < size; i++) {
    const deferred = Deferred.makeUnsafe<void>();
    const state = {
      ready: i === 0,
      deferred,
    };

    // First should start immediately
    if (i === 0) {
      Deferred.doneUnsafe(deferred, Exit.void);
    }

    buffers.set(
      i,
      IndexedBuffer(
        state,
        sink,
        i === last
          ? Effect.void
          : Effect.suspend(() => {
              const next = buffers.get(i + 1)!;
              next.state.ready = true;
              return Deferred.done(next.state.deferred, Exit.void);
            }),
      ),
    );
  }

  return buffers;
}

function IndexedBuffer<A, E, R>(
  state: {
    ready: boolean;
    deferred: Deferred.Deferred<void>;
  },
  sink: Sink.Sink<A, E, R>,
  onDone: Effect.Effect<void>,
) {
  let buffer: Array<A> = [];
  let active = true;
  const forward = (value: A) =>
    Effect.suspend(() => (active ? sink.onSuccess(value) : Effect.void));

  const onSuccess = (value: A) => {
    if (!active) return Effect.void;
    if (state.ready) {
      if (buffer.length === 0) return forward(value);
      buffer.push(value);
      const effect = Effect.forEach(buffer, forward);
      buffer = [];
      return effect;
    } else {
      buffer.push(value);
      return Effect.void;
    }
  };

  const onEnd = Effect.suspend(() => {
    if (!active) return Effect.void;
    return Effect.flatMap(Deferred.await(state.deferred), () => {
      if (!active) return Effect.void;
      if (buffer.length === 0) return onDone;
      const effect = Effect.forEach(buffer, forward);
      buffer = [];
      return Effect.ensuring(effect, onDone);
    });
  });

  return {
    state,
    onSuccess,
    onEnd,
    discard: () => {
      active = false;
      buffer = [];
      Deferred.doneUnsafe(state.deferred, Exit.void);
    },
  };
}
