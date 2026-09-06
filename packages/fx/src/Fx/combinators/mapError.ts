import * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Transforms typed failures while preserving defects and interruption.
 *
 * @remarks
 * ## Why
 *
 * Libraries can expose a domain error without losing the richer Cause that
 * Effect uses for defects, interruption, and composed failures.
 *
 * ## Ownership and lifetime
 *
 * The mapping function runs synchronously for each `Cause.Fail` reported by
 * the source. It does not run for defects or interrupts, which pass through
 * unchanged. Values retain order and cardinality. No resource is acquired and
 * the returned Fx has the same subscription lifetime and services as its source.
 *
 * @example
 * ```ts
 * import { mapError } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const domainFailure = mapError(fail(404), (status) => ({ _tag: "HttpError", status }))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const mapError: {
  <E, E2>(f: (e: E) => E2): <A, R>(self: Fx<A, E, R>) => Fx<A, E2, R>;

  <A, E, R, E2>(self: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R>;
} = dual(2, <A, E, R, E2>(self: Fx<A, E, R>, f: (e: E) => E2): Fx<A, E2, R> =>
  make<A, E2, R>((sink) =>
    self.run(makeSink((cause) => sink.onFailure(Cause.map(cause, f)), sink.onSuccess)),
  ),
);
