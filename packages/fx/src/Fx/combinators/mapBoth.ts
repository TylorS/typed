import * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Transforms both the success and error channels of an Fx using the provided options.
 *
 * Mirrors `Effect.mapBoth`: `onSuccess` maps emitted values, `onFailure` maps the
 * typed failure (via `Cause.map`); defects and interrupts are preserved.
 *
 * @remarks
 * ## Why
 * `mapBoth` transforms success values and typed failures together while preserving the rest of an
 * Effect `Cause`. Every success still emits once in order; only typed failure values are mapped.
 *
 * ## Ownership and lifetime
 * Both callbacks are synchronous and the operation acquires no resources. Defects, interruption,
 * service requirements, and source lifetime pass through unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const normalized = Fx.fail("offline").pipe(Fx.mapBoth({
 *   onFailure: (message) => new Error(message),
 *   onSuccess: (value) => String(value),
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const mapBoth: {
  <E, E2, A, A2>(options: {
    readonly onFailure: (e: E) => E2;
    readonly onSuccess: (a: A) => A2;
  }): <R>(self: Fx<A, E, R>) => Fx<A2, E2, R>;

  <A, E, R, E2, A2>(
    self: Fx<A, E, R>,
    options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2 },
  ): Fx<A2, E2, R>;
} = dual(
  2,
  <A, E, R, E2, A2>(
    self: Fx<A, E, R>,
    options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2 },
  ): Fx<A2, E2, R> =>
    make<A2, E2, R>((sink) =>
      self.run(
        makeSink(
          (cause) => sink.onFailure(Cause.map(cause, options.onFailure)),
          (a) => sink.onSuccess(options.onSuccess(a)),
        ),
      ),
    ),
);
