import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Filters elements of an Fx using a predicate function.
 *
 * @remarks
 * ## Why
 * `filter` keeps the source's push timing and order while allowing zero or one output for each
 * input. The predicate is synchronous, so it adds neither failures nor service requirements.
 *
 * ## Ownership and lifetime
 * No resource or buffer is acquired. The predicate runs while the source invokes the downstream
 * sink; source failure, completion, and interruption are forwarded unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const even = Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.filter((n) => n % 2 === 0))
 * ```
 *
 * @param f - A predicate function.
 * @returns An `Fx` that emits only the elements for which `f` returns `true`.
 * @since 1.0.0
 * @category Selecting values
 */
export const filter: {
  <A>(f: (a: A) => boolean): <E, R>(self: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(self: Fx<A, E, R>, f: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, f: (a: A) => boolean): Fx<A, E, R> =>
  make<A, E, R>((sink) => self.run(sinkCore.filter(sink, f))),
);
