import type { Guard, GuardInput } from "./index.js";

/**
 * Returns a callable Guard unchanged or obtains one from an own callable
 * `asGuard` property. Invalid adapter objects throw `TypeError` immediately.
 *
 * @remarks
 * ## Why
 * Central normalization makes invalid adapter shapes fail at construction instead of later during Effect execution.
 *
 * ## Ownership and lifetime
 * Normalization acquires no resources and returns the existing Guard function or the adapter's result.
 *
 * @example
 * ```ts
 * import { getGuard } from "@typed/guard/getGuard"
 * import { liftPredicate } from "@typed/guard"
 * const guard = getGuard(liftPredicate((value: unknown): value is string => typeof value === "string"))
 * ```
 *
 * @since 1.0.0
 * @category Library adapters
 */
export const getGuard = <I, O, E = never, R = never>(
  guard: GuardInput<I, O, E, R>,
): Guard<I, O, E, R> => {
  if (typeof guard === "function") return guard;

  if (typeof guard !== "object" || guard === null || !Object.hasOwn(guard, "asGuard")) {
    throw new TypeError(
      "Expected a Guard function or an object with an own callable asGuard property",
    );
  }

  const asGuard = guard.asGuard;
  if (typeof asGuard !== "function") {
    throw new TypeError(
      "Expected a Guard function or an object with an own callable asGuard property",
    );
  }

  const normalized = asGuard.call(guard);
  if (typeof normalized !== "function") {
    throw new TypeError("Expected asGuard() to return a Guard function");
  }

  return normalized;
};
