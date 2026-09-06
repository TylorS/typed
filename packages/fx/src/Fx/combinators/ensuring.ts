import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Runs a finalizer with no typed error after the Fx run ends for any reason.
 *
 * @remarks
 * ## Why
 *
 * Resources sometimes belong to the subscription as a whole rather than to
 * individual values. `ensuring` attaches unconditional teardown without
 * changing the source's success or typed-error channels.
 *
 * ## Ownership and lifetime
 *
 * The finalizer runs exactly once after normal completion, failure, defect, or
 * interruption of the source run and follows Effect's `ensuring` finalization
 * semantics. Its `never` typed-error channel does not make it incapable of
 * defecting or being interrupted: a finalizer defect can fail a successful run
 * or combine with the source Cause. Its services are required for the subscription.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { ensuring } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const observed = ensuring(succeed("ready"), Effect.log("subscription closed"))
 * ```
 *
 * @example A `never` typed-error channel can still contain a defect
 * ```ts
 * import { Effect } from "effect"
 * import { ensuring } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const defectiveFinalizer = ensuring(succeed("ready"), Effect.die("close failed"))
 * ```
 *
 * @since 1.0.0
 * @category Resource lifetime
 */
export const ensuring: {
  <R2>(finalizer: Effect.Effect<void, never, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R | R2>;

  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<void, never, R2>): Fx<A, E, R | R2>;
} = dual(
  2,
  <A, E, R, R2>(self: Fx<A, E, R>, finalizer: Effect.Effect<void, never, R2>): Fx<A, E, R | R2> =>
    make<A, E, R | R2>((sink) => self.run(sink).pipe(Effect.ensuring(finalizer))),
);
