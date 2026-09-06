import * as Effect from "effect/Effect";
import type { Fx } from "../Fx.js";
import { unwrapScoped } from "./unwrapScoped.js";
import { Scope } from "effect";

/**
 * Builds an Fx with a subscription-owned Scope shared by setup and streaming.
 *
 * @remarks
 * ## Why
 *
 * Resourceful setup must remain alive while the returned producer runs and be
 * released when that subscription ends. `genScoped` supplies that exact
 * acquisition-to-stream lifetime while removing `Scope` from the public
 * service requirement.
 *
 * ## Ownership and lifetime
 *
 * Every subscription creates one child Scope, runs the generator inside it,
 * then runs the returned Fx in the same Scope. Normal completion, failure,
 * defect, or interruption closes the Scope and its finalizers. Setup failures
 * prevent streaming; all non-Scope errors and services remain in the result.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { genScoped } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const resourceful = genScoped(function* () {
 *   const handle = yield* Effect.acquireRelease(
 *     Effect.succeed({ open: true }),
 *     () => Effect.void
 *   )
 *   return succeed(handle.open)
 * })
 * ```
 *
 * @param f - The generator function.
 * @returns An `Fx` representing the result of the generator.
 * @since 1.0.0
 * @category Generator composition
 */
export const genScoped = <Yield extends Effect.Effect<any, any, any>, Return extends Fx.Any>(
  f: () => Generator<Yield, Return, any>,
): Fx<
  Fx.Success<Return>,
  Fx.Error<Return> | ([Yield] extends [never] ? never : Effect.Error<Yield>),
  Exclude<
    Fx.Services<Return> | ([Yield] extends [never] ? never : Effect.Services<Yield>),
    Scope.Scope
  >
> => unwrapScoped(Effect.gen(f));
