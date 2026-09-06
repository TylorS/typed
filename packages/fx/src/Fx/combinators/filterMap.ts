import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Maps and filters elements of an Fx in a single operation.
 *
 * @remarks
 * ## Why
 * `filterMap` represents a partial synchronous transformation explicitly with `Option`. Each input
 * produces at most one output: `Some` is unwrapped and `None` is omitted, with source order intact.
 *
 * ## Ownership and lifetime
 * This operation is stateless and acquires no resources. It preserves the source's error and
 * service channels and stops whenever the source or consuming fiber stops.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Option } from "effect"
 *
 * const numbers = Fx.fromIterable(["1", "x", "2"]).pipe(
 *   Fx.filterMap((text) => Number.isNaN(Number(text)) ? Option.none() : Option.some(Number(text))),
 * )
 * ```
 *
 * @param f - A function that returns an `Option` for each element.
 * @returns An `Fx` that emits values for which `f` returns `Some`.
 * @since 1.0.0
 * @category Selecting values
 */
export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <E, R>(self: Fx<A, E, R>) => Fx<B, E, R>;

  <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R>;
} = dual(2, <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R> =>
  make<B, E, R>((sink) => self.run(sinkCore.filterMap(sink, f))),
);
