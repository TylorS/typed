/** The Effect runtime property key used to evaluate an Effectable value.
 *
 * @remarks
 * ## Why
 *
 * Effect's generator interpreter steps yielded Effectable objects through this property. Typed
 * must use the exact runtime key so its Effect-compatible Fx and state objects evaluate their
 * underlying work rather than returning themselves.
 *
 * ## Ownership and lifetime
 *
 * This is immutable protocol metadata. Reading it acquires no services and retains no resources.
 *
 * The value must remain byte-for-byte aligned with Effect's internal
 * `` `${EffectTypeId}/evaluate` `` key. It is therefore published for advanced implementors but is
 * coupled to Effect runtime internals and may change between prereleases.
 *
 * @example
 * ```ts
 * import { EFFECT_EVALUATE_KEY } from "@typed/fx/Fx/internal/effectableEvaluateKey"
 *
 * EFFECT_EVALUATE_KEY // "~effect/Effect/evaluate"
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export const EFFECT_EVALUATE_KEY = "~effect/Effect/evaluate" as const;
