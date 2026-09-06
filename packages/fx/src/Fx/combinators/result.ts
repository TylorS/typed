import * as Cause from "effect/Cause";
import * as Result from "effect/Result";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Materializes success and failure of an Fx as `Result` values.
 *
 * - **Success**: each emitted value is wrapped as `Result.succeed(value)`.
 * - **Failure**: any failure (including typed error, defect, and interrupt) is
 *   materialized as `Result.fail(cause)`. The output error type is `Cause<E>`,
 *   so defects and interrupts are explicitly represented in the `Result` and
 *   the resulting Fx has error type `never`.
 *
 * The resulting Fx never fails at the stream level; all outcomes are emitted as
 * `Result<A, Cause<E>>`. Consumers can use `Result.match` or `Result.isSuccess` /
 * `Result.isFailure` to handle success vs failure (including defect/interrupt).
 *
 * @remarks
 * ## Why
 *
 * `Result` is convenient when success and failure should travel through one
 * data channel, while retaining the complete Cause rather than flattening it
 * into the typed error alone.
 *
 * ## Ownership and lifetime
 *
 * Each source value emits one successful Result in order. A terminal cause
 * emits one failed Result and ends normally. The source is subscribed once;
 * no resource is acquired and an interrupt reported by the source becomes
 * data, although interrupting the outer running fiber still stops the run.
 *
 * @example
 * ```ts
 * import { result } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const outcomes = result(fail("offline"))
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` emitting `Result<A, Cause<E>>`.
 * @since 1.0.0
 * @category Errors and recovery
 */
export const result = <A, E, R>(fx: Fx<A, E, R>): Fx<Result.Result<A, Cause.Cause<E>>, never, R> =>
  make<Result.Result<A, Cause.Cause<E>>, never, R>((sink) =>
    fx.run({
      onSuccess: (value) => sink.onSuccess(Result.succeed(value)),
      onFailure: (cause) => sink.onSuccess(Result.fail(cause)),
    }),
  );
