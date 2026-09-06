import * as Effect from "effect/Effect";
import type * as Equivalence from "effect/Equivalence";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as sinkCore from "../../Sink/combinators.js";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Drops elements that are equal to the previous element using a custom equivalence function.
 *
 * @remarks
 * ## Why
 * `skipRepeatsWith` defines consecutive equality for values that need domain-specific comparison.
 * It compares against the last emitted value, emits the first value, and otherwise preserves order.
 *
 * ## Ownership and lifetime
 * The per-run previous-value state is updated atomically and released when observation ends. The
 * pure equivalence adds no failures or services and acquires no resource.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const byId = Fx.skipRepeatsWith<{ id: number }>((a, b) => a.id === b.id)
 * const changes = Fx.fromIterable([{ id: 1 }, { id: 1 }, { id: 2 }]).pipe(byId)
 * ```
 *
 * @param Eq - The equivalence function to use.
 * @returns An `Fx` with consecutive duplicates removed.
 * @since 1.0.0
 * @category Selecting values
 */
export const skipRepeatsWith =
  <A>(Eq: Equivalence.Equivalence<A>) =>
  <E, R>(fx: Fx<A, E, R>): Fx<A, E, R> =>
    make<A, E, R>((sink) =>
      sinkCore.withState(sink, Option.none<A>(), (sink) =>
        fx.run(
          makeSink(sink.onFailure, (a2) =>
            Effect.flatten(
              Ref.modify(
                sink.state,
                Option.match({
                  onNone: () => [sink.onSuccess(a2), Option.some(a2)],
                  onSome: (a) =>
                    Eq(a, a2)
                      ? [Effect.void, Option.some(a)]
                      : [sink.onSuccess(a2), Option.some(a2)],
                }),
              ),
            ),
          ),
        ),
      ),
    );
