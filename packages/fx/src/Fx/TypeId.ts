import { hasProperty } from "effect/Predicate";
import type { Fx } from "./Fx.js";

/**
 * Runtime symbol carried by every `Fx` implementation.
 *
 * @remarks
 * ## Why
 *
 * A global symbol lets independent packages recognize an `Fx` structurally without
 * invoking it or relying on a concrete implementation class.
 *
 * ## Ownership and lifetime
 *
 * Reading or comparing the symbol starts no work and acquires no resources.
 *
 * @example
 * ```ts
 * import { FxTypeId, succeed } from "@typed/fx/Fx"
 *
 * const carriesFxProtocol = FxTypeId in succeed("ready")
 * ```
 *
 * @since 1.0.0
 * @category Runtime inspection
 */
export const FxTypeId = Symbol.for("@typed/fx/Fx");

/**
 * Type of the `FxTypeId` protocol symbol.
 *
 * @remarks
 * ## Why
 *
 * Implementations can declare the exact computed property required by `Fx`.
 *
 * ## Ownership and lifetime
 *
 * This alias performs no runtime work.
 * @since 1.0.0
 * @category Runtime inspection
 */
export type FxTypeId = typeof FxTypeId;

/**
 * Checks whether a value carries the `FxTypeId` protocol property.
 *
 * @remarks
 * ## Why
 *
 * Interoperability code can distinguish an already constructed `Fx` from effects,
 * streams, iterables, and arbitrary values before choosing an explicit adapter.
 *
 * ## Ownership and lifetime
 *
 * The guard performs one property check. It does not subscribe to or run the value.
 *
 * @example
 * ```ts
 * import { isFx, succeed } from "@typed/fx/Fx"
 *
 * const candidate: unknown = succeed(42)
 * const value = isFx(candidate) ? candidate : succeed(candidate)
 * ```
 *
 * @since 1.0.0
 * @category Runtime inspection
 */
export function isFx(u: unknown): u is Fx<any, any, any> {
  return hasProperty(u, FxTypeId);
}
