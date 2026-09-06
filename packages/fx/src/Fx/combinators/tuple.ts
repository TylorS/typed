import * as Effect from "effect/Effect";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import { succeed } from "../constructors/succeed.js";
import type { Fx } from "../Fx.js";
import { map } from "./map.js";

/**
 * Combines multiple Fx streams into a single Fx that emits a tuple of the latest values from each stream.
 * The resulting Fx waits for all input streams to emit at least once before emitting the first tuple.
 * Afterwards, it emits a new tuple whenever any input stream emits a new value.
 *
 * @remarks
 * ## Why
 * `tuple` combines independent push sources by latest value while retaining their positional types.
 * It emits nothing until every source has produced once, then emits a snapshot after any update.
 *
 * ## Ownership and lifetime
 * All inputs run concurrently as children of the consumer and one latest value per input is retained
 * for that run. Failure/interruption stops the group; normal completion waits for every input.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const point = Fx.tuple(Fx.succeed(10), Fx.succeed(20))
 * ```
 *
 * @param fxs - The Fx streams to combine.
 * @returns An `Fx` emitting tuples of values.
 * @since 1.0.0
 * @category Combining sources
 */
export function tuple<FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fxs: FX
): Fx<
  { readonly [K in keyof FX]: Fx.Success<FX[K]> },
  Fx.Error<FX[number]>,
  Fx.Services<FX[number]>
> {
  if (fxs.length === 0) return succeed([] as { readonly [K in keyof FX]: Fx.Success<FX[K]> });
  if (fxs.length === 1) {
    return map(fxs[0], (value) => [value] as { readonly [K in keyof FX]: Fx.Success<FX[K]> });
  }

  type Result = { readonly [K in keyof FX]: Fx.Success<FX[K]> };
  return make(
    Effect.fn(function* (sink) {
      const len = fxs.length;
      // oxlint-disable-next-line unicorn/no-new-array
      const result: Array<Fx.Success<FX[number]>> = new Array(len);
      const filled = new Set<number>();

      return yield* Effect.forEach(
        fxs,
        (fx, i) =>
          fx.run(
            makeSink(
              sink.onFailure,
              Effect.fn(function* (value) {
                result[i] = value;
                filled.add(i);
                if (filled.size === len) {
                  yield* sink.onSuccess(result.slice(0) as Result);
                }
              }),
            ),
          ),
        { concurrency: "unbounded", discard: true },
      );
    }),
  );
}

/**
 * Combines a record of Fx streams into a single Fx that emits a record of the latest values.
 * Similar to `tuple`, but for objects.
 *
 * @remarks
 * ## Why
 * `struct` gives latest-value combination stable field names. It waits for every field once and
 * then emits a new immutable record when any field source updates.
 *
 * ## Ownership and lifetime
 * It delegates concurrent ownership and retained latest values to `tuple`. Input failures and
 * services are unioned, and all runs end with the consuming Fx.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const user = Fx.struct({ name: Fx.succeed("Ada"), online: Fx.succeed(true) })
 * ```
 *
 * @param fxs - A record of Fx streams.
 * @returns An `Fx` emitting records of values.
 * @since 1.0.0
 * @category Combining sources
 */
export function struct<FXS extends Readonly<Record<string, Fx<any, any, any>>>>(
  fxs: FXS,
): Fx<
  { readonly [K in keyof FXS]: Fx.Success<FXS[K]> },
  Fx.Error<FXS[keyof FXS]>,
  Fx.Services<FXS[keyof FXS]>
> {
  return map(
    tuple(...Object.entries(fxs).map(([key, fx]) => map(fx, (value) => [key, value] as const))),
    Object.fromEntries as (entries: ReadonlyArray<readonly [string, any]>) => {
      readonly [K in keyof FXS]: Fx.Success<FXS[K]>;
    },
  );
}
