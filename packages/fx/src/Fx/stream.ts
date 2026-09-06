import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Queue from "effect/Queue";
import * as Stream from "effect/Stream";
import * as Sink from "../Sink/Sink.js";
import { make } from "./constructors/make.js";
import type * as Fx from "./Fx.js";

/**
 * Buffering and callback options accepted while adapting an `Fx` to an Effect `Stream`.
 *
 * @remarks
 * ## Why
 *
 * The adapter exposes Effect Stream's own callback policy instead of inventing a
 * second buffering vocabulary.
 *
 * ## Ownership and lifetime
 *
 * This type alias owns no queue or subscription. The selected policy takes effect
 * only when the resulting Stream is run.
 *
 * @since 1.0.0
 * @category Operator options
 */
export type ToStreamOptions = Parameters<typeof Stream.callback<unknown, unknown, unknown>>[1];

/**
 * Adapts a push-based `Fx` to an Effect `Stream`.
 *
 * @remarks
 * ## Why
 *
 * Existing Effect [Stream](https://effect.website/docs/v4/api/effect/Stream) consumers
 * can use an `Fx` without losing the producer's typed values, failures, or services.
 * Values and causes cross a queue in emission order; the queue ends when the `Fx` run
 * completes.
 *
 * ## Ownership and lifetime
 *
 * Conversion is lazy. Running the Stream allocates the callback queue and runs the
 * `Fx`; the Stream's scope owns both. Interruption closes the callback subscription
 * through Effect Stream's lifecycle. Buffering follows `options`.
 *
 * @example
 * ```ts
 * import { Stream } from "effect"
 * import { fromIterable, toStream } from "@typed/fx/Fx"
 *
 * const values = toStream(fromIterable([1, 2, 3]))
 * const total = Stream.runFold(values, () => 0, (sum, value) => sum + value)
 * ```
 *
 * @since 1.0.0
 * @category Stream interop
 */
export const toStream = <A, E, R>(
  fx: Fx.Fx<A, E, R>,
  options?: ToStreamOptions,
): Stream.Stream<A, E, R> =>
  Stream.callback<A, E, R>(
    (queue) =>
      Effect.flatMap(
        fx.run(
          Sink.make(
            (cause) => Queue.failCause(queue, cause),
            (value) => Queue.offer(queue, value),
          ),
        ), 
        () => Queue.end(queue)
      ),
    options,
  );

/**
 * Effect Stream mapping options used while delivering elements to an `Fx` sink.
 *
 * @remarks
 * ## Why
 *
 * Stream-to-sink scheduling and concurrency remain controlled by Effect Stream's
 * established `mapEffect` options.
 *
 * ## Ownership and lifetime
 *
 * This type alias performs no acquisition. Options are applied each time the
 * adapted `Fx` is run.
 *
 * @since 1.0.0
 * @category Operator options
 */
export type FromStreamOptions = Parameters<
  typeof Stream.mapEffect<unknown, unknown, unknown, unknown>
>[1];

/**
 * Adapts an Effect `Stream` to a push-based `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Stream producers can participate in `Fx` composition without wrapping their
 * behavior in a new abstraction. Each Stream element is offered to the sink through
 * `Stream.mapEffect`; Stream causes are forwarded unchanged to `sink.onFailure`.
 *
 * ## Ownership and lifetime
 *
 * Conversion starts nothing. Each `Fx.run` starts one Stream run owned by the caller's
 * fiber and scope. Interruption stops the Stream and its finalizers. Delivery order
 * and concurrency follow Effect Stream's `mapEffect` semantics and `options`.
 *
 * @example
 * ```ts
 * import { Effect, Stream } from "effect"
 * import { collectAll, fromStream } from "@typed/fx/Fx"
 *
 * const source = fromStream(Stream.make("a", "b"))
 * const values = collectAll(source)
 * const program = Effect.map(values, (items) => items.join(""))
 * ```
 *
 * @since 1.0.0
 * @category Stream interop
 */
export const fromStream = <A, E, R>(
  stream: Stream.Stream<A, E, R>,
  options?: FromStreamOptions,
): Fx.Fx<A, E, R> =>
  make<A, E, R>(
    <RSink = never>(sink: Sink.Sink<A, E, RSink>): Effect.Effect<unknown, never, R | RSink> =>
      pipe(
        stream,
        Stream.mapEffect(sink.onSuccess, options),
        Stream.catchCause((cause) => Stream.fromEffect(sink.onFailure(cause))),
        Stream.runDrain,
      ),
  );
