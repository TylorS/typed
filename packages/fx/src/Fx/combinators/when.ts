import { dual } from "effect/Function";
import type { Scope } from "effect/Scope";
import { succeed } from "../constructors/succeed.js";
import type { Fx } from "../Fx.js";
import { switchMap } from "./switchMap.js";

/**
 * Conditionally runs one of two Fx streams based on the boolean value emitted by the condition stream.
 *
 * @remarks
 * ## Why
 * `if` turns boolean pushes into a switchable branch. Each condition value selects one branch,
 * interrupts the previous branch, and forwards only values from the currently selected Fx.
 *
 * ## Ownership and lifetime
 * The required Scope owns the active branch. Replacement interrupts and awaits the previous branch;
 * consumer interruption closes the active work. Failures are delivered to the Sink and only become
 * terminal when the chosen Sink policy interrupts observation.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const status = Fx.if(Fx.fromIterable([true, false]), { onTrue: Fx.succeed("on"), onFalse: Fx.succeed("off") })
 * ```
 *
 * @param condition - An `Fx` emitting booleans.
 * @param matchers - An object containing `onTrue` and `onFalse` Fx streams.
 * @returns An `Fx` that switches between `onTrue` and `onFalse` based on the condition.
 * @since 1.0.0
 * @category Conditional sources
 */
const if_: {
  <B, E2, R2, C, E3, R3>(matchers: {
    onTrue: Fx<B, E2, R2>;
    onFalse: Fx<C, E3, R3>;
  }): <E, R>(condition: Fx<boolean, E, R>) => Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope>;

  <E, R, B, E2, R2, C, E3, R3>(
    condition: Fx<boolean, E, R>,
    matchers: {
      onTrue: Fx<B, E2, R2>;
      onFalse: Fx<C, E3, R3>;
    },
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope>;
} = dual(
  2,
  <E, R, B, E2, R2, C, E3, R3>(
    condition: Fx<boolean, E, R>,
    matchers: {
      onTrue: Fx<B, E2, R2>;
      onFalse: Fx<C, E3, R3>;
    },
  ): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope> => {
    return switchMap(condition, (pass): Fx<B | C, E2 | E3, R2 | R3> =>
      pass ? matchers.onTrue : matchers.onFalse,
    );
  },
);

export { if_ as if };

/**
 * Conditionally emits one of two values based on the boolean value emitted by the condition stream.
 *
 * @remarks
 * ## Why
 * `when` is the value-only form of `if`, implemented with `switchMap`. Each condition push selects a
 * constant inner Fx, but a newer condition can interrupt that inner before it emits; output
 * cardinality can therefore be lower than the number of condition values.
 *
 * ## Ownership and lifetime
 * It delegates branch switching to `if`; its constant branches acquire no resources. The Scope owns
 * scheduled branch fibers, replacement awaits their interruption, and source completion waits for
 * the latest selected branch.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const program = Fx.collectAll(
 *   Fx.when(Fx.fromIterable([true, false]), { onTrue: "yes", onFalse: "no" })
 * ) // the later `false` may replace `true` before "yes" is emitted
 * ```
 *
 * @param condition - An `Fx` emitting booleans.
 * @param matchers - An object containing `onTrue` and `onFalse` values.
 * @returns An `Fx` that emits the matched value.
 * @since 1.0.0
 * @category Conditional sources
 */
export const when = <E, R, B, C>(
  condition: Fx<boolean, E, R>,
  matchers: {
    onTrue: B;
    onFalse: C;
  },
): Fx<B | C, E, R | Scope> => {
  return if_(condition, { onTrue: succeed(matchers.onTrue), onFalse: succeed(matchers.onFalse) });
};
