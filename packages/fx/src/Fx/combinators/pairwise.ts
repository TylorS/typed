import * as Option from "effect/Option";
import type { Fx } from "../Fx.js";
import { filterMapLoop } from "./filterMapLoop.js";

/**
 * Emits consecutive pairs `[previous, current]`. The first value is not emitted
 * until a second value arrives.
 *
 * Equivalent to RxJS `pairwise` and Effect `Stream.sliding(2)` for pairs.
 *
 * @remarks
 * ## Why
 * `pairwise` exposes transitions rather than isolated values. For `n` inputs it emits `max(0,
 * n - 1)` adjacent pairs in source order, retaining only the immediately preceding value.
 *
 * ## Ownership and lifetime
 * The previous-value cell belongs to one run of the returned Fx and is discarded when that run
 * completes or is interrupted. Source errors and services are unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const changes = Fx.fromIterable([10, 13, 12]).pipe(Fx.pairwise)
 * ```
 *
 * @since 1.0.0
 * @category Stateful transforms
 */
export const pairwise = <A, E = never, R = never>(self: Fx<A, E, R>): Fx<readonly [A, A], E, R> =>
  filterMapLoop(self, Option.none<A>(), (prev, a) =>
    Option.match(prev, {
      onNone: () => [Option.none(), Option.some(a)] as const,
      onSome: (previous) => [Option.some([previous, a] as const), Option.some(a)] as const,
    }),
  );
