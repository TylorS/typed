import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { SpanOptionsNoTrace } from "effect/Tracer";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { isFx } from "../TypeId.js";

/**
 * Traces the whole subscription and each success or failure delivery.
 *
 * @remarks
 * ## Why
 *
 * A single Effect span around subscription setup cannot show time spent in
 * downstream sink callbacks. Nested delivery spans make the push boundary
 * visible while keeping the source's values and types unchanged.
 *
 * ## Ownership and lifetime
 *
 * Every run creates an `Fx(name)` span covering the source subscription. Each
 * `onSuccess` and `onFailure` callback executes in its own child span. Span
 * lifetime follows the Effects exactly; interruption closes active spans.
 * Options are forwarded to all three span kinds, and no service requirement or
 * failure is added beyond the configured Effect tracer.
 *
 * @example
 * ```ts
 * import { withSpan } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const traced = withSpan(succeed("ready"), "load-settings", {
 *   attributes: { component: "settings" }
 * })
 * ```
 *
 * @since 1.0.0
 * @category Observing failures
 */
export const withSpan: {
  (name: string, options?: SpanOptionsNoTrace): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, name: string, options?: SpanOptionsNoTrace): Fx<A, E, R>;
} = dual(
  (args) => isFx(args[0]),
  <A, E, R>(fx: Fx<A, E, R>, name: string, options?: SpanOptionsNoTrace): Fx<A, E, R> =>
    make<A, E, R>(<RSink>(sink: Sink<A, E, RSink>) =>
      Effect.withSpan(
        fx.run(
          makeSink(
            (cause) => Effect.withSpan(sink.onFailure(cause), `onFailure(${name})`, options),
            (value) => Effect.withSpan(sink.onSuccess(value), `onSuccess(${name})`, options),
          ),
        ),
        `Fx(${name})`,
        options,
      ),
    ),
);
