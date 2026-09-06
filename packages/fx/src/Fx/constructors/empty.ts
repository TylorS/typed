import { void as void_ } from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * An Fx that emits no values and completes immediately.
 *
 * @remarks
 * ## Why
 *
 * `empty` is the zero-emission producer used for conditional and identity branches.
 *
 * ## Ownership and lifetime
 *
 * Each run completes synchronously, emits nothing, and acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { empty, first } from "@typed/fx/Fx"
 *
 * const program = Effect.map(first(empty), Option.isNone)
 * ```
 *
 * @since 1.0.0
 * @category Value sources
 */
export const empty: Fx<never, never, never> = make<never, never, never>(() => void_);
