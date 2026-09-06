/**
 * Combines a value with a mapping function.
 *
 * @remarks
 * ## Why
 *
 * Keeps the value and transformation relationship visible in the type signature.
 *
 * ## Ownership and lifetime
 *
 * Performs no acquisition and retains no resources after returning.
 *
 * @example
 * ```ts
 * import { Complete } from "@fixture/docs"
 *
 * const result = Complete.combine(1, (value) => String(value))
 * ```
 *
 * @since 1.2.0
 * @category combinators
 */
export function combine<A, B>(value: A, map: (value: A) => B): B;
export function combine<A>(value: A): A;
export function combine<A, B>(value: A, map?: (value: A) => B): A | B {
  return map === undefined ? value : map(value);
}

/** @internal */
export const privateHelper = "not public documentation";
