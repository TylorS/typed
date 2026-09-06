import * as Cause from "effect/Cause";
import { flow } from "effect/Function";
import { failCause } from "./failCause.js";

const fromFailuresCause = <E>(failures: Iterable<E>): Cause.Cause<E> =>
  Array.from(failures).reduce(
    (acc, e) => Cause.combine(acc, Cause.fail(e)),
    Cause.empty as Cause.Cause<E>,
  );

/**
 * Creates an Fx from a collection of failures (errors).
 *
 * @remarks
 * ## Why
 *
 * Validation and batch operations can preserve every independent typed failure in a
 * single Effect `Cause` rather than choosing one error or emitting partial values.
 * Equal reasons are de-duplicated by `Cause.combine`.
 *
 * ## Ownership and lifetime
 *
 * The iterable is consumed eagerly when `fromFailures` is called. Running the result
 * forwards the combined cause once, emits no values, and acquires no resources. An
 * empty iterable produces the empty Cause.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { fromFailures, observe } from "@typed/fx/Fx"
 *
 * const failures = fromFailures(["name", "email"])
 * const program = observe(failures, () => Effect.void).pipe(
 *   Effect.catch((error) => Effect.succeed(error))
 * )
 * ```
 *
 * @param failures - An iterable of failures.
 * @returns An `Fx` that fails with the combined failures.
 * @since 1.0.0
 * @category Failure sources
 */
export const fromFailures = /*#__PURE__*/ flow(fromFailuresCause, failCause);
