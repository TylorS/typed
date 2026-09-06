import { equals } from "effect/Equal";
import * as Equivalence from "effect/Equivalence";
import type * as Exit from "effect/Exit";

/** Lifts value equivalence to successes while comparing failure Causes structurally.
 *
 * @remarks
 * ## Why
 *
 * State cells store full `Exit` values. Successful values should follow the caller's domain
 * equivalence, while failures must retain Effect's Cause structure so repeated equivalent failures
 * can be suppressed without collapsing distinct defects, interruptions, or compositions.
 *
 * ## Ownership and lifetime
 *
 * The returned function closes over `A` and acquires no services or Scope. Each comparison is pure;
 * its cost is the cost of `A` for two successes or Effect's structural Cause equality for two
 * failures. A success and failure are always different.
 *
 * @example
 * ```ts
 * import { getExitEquivalence } from "@typed/fx/Fx/internal/equivalence"
 * import * as Equivalence from "effect/Equivalence"
 * import * as Exit from "effect/Exit"
 *
 * const equivalent = getExitEquivalence(Equivalence.Number)
 * equivalent(Exit.succeed(1), Exit.succeed(1)) // true
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export const getExitEquivalence = <E, A>(A: Equivalence.Equivalence<A>) =>
  Equivalence.make<Exit.Exit<A, E>>((a, b) => {
    if (a._tag === "Failure") {
      return b._tag === "Failure" && equals(a.cause, b.cause);
    } else {
      return b._tag === "Success" && A(a.value, b.value);
    }
  });
