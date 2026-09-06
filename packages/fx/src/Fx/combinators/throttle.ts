import { Duration, Effect, Scope } from "effect";
import * as FiberHandle from "effect/FiberHandle";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { isFx } from "../TypeId.js";
import { exhaustMap } from "./exhaustMap.js";
import { extendScope } from "../internal/scope.js";

/**
 * Options for {@link throttle}. A duration-only call is leading-edge
 * (`{ leading: true, trailing: false }`).
 *
 * @remarks
 * ## Why
 *
 * Leading and trailing edges answer different interaction needs, so the
 * window policy is explicit rather than hidden behind separate operators.
 *
 * ## Ownership and lifetime
 *
 * This immutable value owns no resource. `throttle` reads it when constructing
 * the Fx; the resulting subscription owns the timer and pending value.
 *
 * @example
 * ```ts
 * import type { ThrottleOptions } from "@typed/fx/Fx"
 *
 * const options: ThrottleOptions = {
 *   duration: "250 millis",
 *   leading: true,
 *   trailing: true
 * }
 * ```
 *
 * @since 1.0.0
 * @category Operator options
 */
export type ThrottleOptions = {
  readonly duration: Duration.Input;
  readonly leading?: boolean | undefined;
  readonly trailing?: boolean | undefined;
};

const isOptions = (u: unknown): u is ThrottleOptions =>
  typeof u === "object" && u !== null && "duration" in u && !Duration.isDuration(u);

const resolve = (
  durationOrOptions: Duration.Input | ThrottleOptions,
): { readonly duration: Duration.Input; readonly leading: boolean; readonly trailing: boolean } => {
  if (isOptions(durationOrOptions)) {
    return {
      duration: durationOrOptions.duration,
      leading: durationOrOptions.leading ?? true,
      trailing: durationOrOptions.trailing ?? false,
    };
  }
  return { duration: durationOrOptions, leading: true, trailing: false };
};

const throttleWindow = <A, E, R>(
  fx: Fx<A, E, R>,
  duration: Duration.Input,
  leading: boolean,
  trailing: boolean,
): Fx<A, E, R | Scope.Scope> =>
  make<A, E, R | Scope.Scope>(
    Effect.fn(function* (sink) {
      const open = yield* Ref.make(false);
      const pending = yield* Ref.make(Option.none<A>());
      const extra = yield* Ref.make(false);
      const window = yield* FiberHandle.make<void, never>();

      const closeWindow = Effect.gen(function* () {
        const hadExtra = yield* Ref.get(extra);
        const shouldEmit =
          trailing && (!leading || hadExtra) ? yield* Ref.get(pending) : Option.none<A>();
        yield* Ref.set(open, false);
        yield* Ref.set(pending, Option.none());
        yield* Ref.set(extra, false);
        if (Option.isSome(shouldEmit)) {
          yield* sink.onSuccess(shouldEmit.value);
        }
      });

      yield* fx.run(
        makeSink(sink.onFailure, (a: A) =>
          Effect.gen(function* () {
            const isOpen = yield* Ref.get(open);
            if (!isOpen) {
              yield* Ref.set(open, true);
              yield* Ref.set(pending, Option.some(a));
              yield* Ref.set(extra, false);
              if (leading) {
                yield* sink.onSuccess(a);
              }
              yield* FiberHandle.run(
                window,
                Effect.sleep(duration).pipe(Effect.andThen(closeWindow)),
              );
              return;
            }
            yield* Ref.set(pending, Option.some(a));
            yield* Ref.set(extra, true);
          }),
        ),
      );

      yield* FiberHandle.awaitEmpty(window);
    }, extendScope),
  );

/**
 * Limits emissions to configured leading and trailing edges of fixed windows.
 *
 * Pass `{ duration, leading, trailing }` for trailing or both-edge behavior.
 * A duration alone defaults to `{ leading: true, trailing: false }`.
 *
 * @remarks
 * ## Why
 *
 * Throttling bounds push frequency while allowing immediate feedback, a final
 * settled value, or both, without moving timing state outside the Fx graph.
 *
 * ## Ownership and lifetime
 *
 * The first value opens a window. Leading mode emits it immediately. Values
 * arriving while open replace one pending latest value; trailing mode emits
 * that value when the timer closes, except that both-edge mode does not repeat
 * the first value unless another arrived. Windows never overlap. Source errors
 * propagate, source completion waits for the active window, and interruption
 * stops the scoped timer and discards pending state.
 *
 * @example
 * ```ts
 * import { throttle } from "@typed/fx/Fx"
 * import { fromIterable } from "@typed/fx/Fx"
 *
 * const bounded = throttle(fromIterable([1, 2, 3]), {
 *   duration: "250 millis",
 *   leading: true,
 *   trailing: true
 * })
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const throttle: {
  (duration: Duration.Input): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  (options: ThrottleOptions): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
  <A, E, R>(fx: Fx<A, E, R>, options: ThrottleOptions): Fx<A, E, R | Scope.Scope>;
} = dual(
  (args) => isFx(args[0]),
  <A, E, R>(
    fx: Fx<A, E, R>,
    durationOrOptions: Duration.Input | ThrottleOptions,
  ): Fx<A, E, R | Scope.Scope> => {
    const { duration, leading, trailing } = resolve(durationOrOptions);
    if (leading && !trailing) {
      return exhaustMap(fx, (a) =>
        make(
          Effect.fn(function* (sink) {
            yield* sink.onSuccess(a);
            yield* Effect.sleep(duration);
          }),
        ),
      );
    }
    return throttleWindow(fx, duration, leading, trailing);
  },
);
