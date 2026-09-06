import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { RefSubject } from "@typed/fx";
import { drain, isFx } from "@typed/fx/Fx";
import type { Renderable } from "@typed/template";

type RefInput = (element: never) => unknown;
type RefTarget<Ref> =
  NonNullable<Ref> extends (element: infer Target) => unknown ? Target : unknown;
type RefResult<Ref> =
  NonNullable<Ref> extends (...args: Array<never>) => infer Result ? Result : never;
type RefError<Ref> = Renderable.Error<NonNullable<Ref> | RefResult<Ref>>;
type RefServices<Ref> = Renderable.Services<NonNullable<Ref> | RefResult<Ref>>;
type HydrationProtocol<Ref> =
  NonNullable<Ref> extends RefSubject.HydrationRef<infer E, infer R>
    ? RefSubject.HydrationRef<E, R>
    : unknown;

/**
 * Ref callback produced by combining two compatible element refs.
 *
 * @remarks
 * ## Why
 * User and component refs can observe the exact same DOM element without one
 * overwriting the other, while their error/service channels remain visible.
 *
 * ## Ownership and lifetime
 * The callback sequences both refs inside the element's rendering Scope. At
 * most one input may carry `HydrationRef` ownership; that protocol is retained
 * on the composed callback.
 *
 * @since 1.0.0
 * @category Ref composition
 */
export type ComposedRef<First, Second> = ((
  element: RefTarget<First> & RefTarget<Second>,
) => Effect.Effect<
  void,
  RefError<First> | RefError<Second>,
  RefServices<First> | RefServices<Second>
>) &
  HydrationProtocol<First> &
  HydrationProtocol<Second>;

/**
 * Composes two element refs in order.
 *
 * @remarks
 * ## Why
 * A component's internal ref and a caller's ref both need the real mounted
 * node. Each return value may be void, Effect, Stream, or Fx, and composition
 * normalizes those forms without hiding failures or services.
 *
 * ## Ownership and lifetime
 * The first ref runs before the second. Streams and Fx values are drained in
 * the caller's Scope and interrupted on unmount. The function throws
 * synchronously when both refs claim hydration ownership because applying two
 * serialized states to one element is ambiguous.
 *
 * @example
 * ```ts
 * import { composeRefs } from "@typed/ui/Dom/Refs"
 * import { Effect } from "effect"
 *
 * const ref = composeRefs(
 *   (element: HTMLButtonElement) => Effect.sync(() => element.focus()),
 *   (element: HTMLButtonElement) => console.log(element)
 * )
 * ```
 *
 * @since 1.0.0
 * @category Ref composition
 */
export function composeRefs<
  const First extends RefInput | null | undefined,
  const Second extends RefInput | null | undefined = undefined,
>(first: First, second?: Second): ComposedRef<First, Second> | undefined {
  if (!first && !second) return undefined;

  const hydrationOwners = [first, second].filter(RefSubject.isHydrationRef);
  if (hydrationOwners.length > 1) {
    throw new TypeError("Only one hydration ref can own an element");
  }

  const composed = Effect.fn((element: RefTarget<First> & RefTarget<Second>) =>
    Effect.andThen(runRef(first, element), runRef(second, element)),
  );
  const hydrationOwner = hydrationOwners[0] as RefSubject.HydrationRef<any, any> | undefined;
  const ref =
    hydrationOwner === undefined
      ? composed
      : Object.assign(composed, {
          [RefSubject.HydrationRefTypeId]: hydrationOwner[RefSubject.HydrationRefTypeId],
        });

  return ref as ComposedRef<First, Second>;
}

function runRef<const Ref extends RefInput | null | undefined>(
  ref: Ref,
  element: RefTarget<Ref>,
): Effect.Effect<void, RefError<Ref>, RefServices<Ref>> {
  type R = Effect.Effect<void, RefError<Ref>, RefServices<Ref>>;
  if (!ref) return Effect.void;
  const result = ref(element as never);
  if (Effect.isEffect(result)) return Effect.asVoid(result) as R;
  if (Stream.isStream(result)) return Stream.runDrain(result) as R;
  if (isFx(result)) return drain(result) as R;
  return Effect.void;
}
