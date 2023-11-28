/**
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context/Identifier"
import type { Effect } from "effect"
import { strict } from "effect/Equivalence"
import type { Scope } from "effect/Scope"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

const add = (x: number): number => x + 1
const sub = (x: number): number => x - 1

/**
 * A RefSubject holding a number values
 * @since 1.18.0
 * @category models
 */
export interface RefNumber<R, E> extends RefSubject.RefSubject<R, E, number> {}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E>(
  initial: Effect.Effect<R, E, number>
): Effect.Effect<R | Scope, never, RefNumber<never, E>>
export function make<R, E>(
  initial: Fx.Fx<R, E, number>
): Effect.Effect<R | Scope, never, RefNumber<never, E>>

export function make<R, E>(
  initial: Fx.FxInput<R, E, number>
): Effect.Effect<R | Scope, never, RefNumber<never, E>> {
  return RefSubject.make(initial, strict())
}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function of(
  initial: number
): Effect.Effect<Scope, never, RefNumber<never, never>> {
  return RefSubject.of(initial, strict())
}

/**
 * Create a Tagged RefNumber
 * @since 1.18.0
 * @category constructors
 */
export const tagged: {
  <const I extends IdentifierConstructor<any>>(
    identifier: I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, number>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, number>
} = RefSubject.tagged<never, number>(strict())

/**
 * Set the value to true
 * @since 1.18.0
 */
export const increment: <R, E>(ref: RefNumber<R, E>) => Effect.Effect<R, E, number> = <R, E>(
  ref: RefNumber<R, E>
) => ref.update(add)

/**
 * Set the value to false
 * @since 1.18.0
 */
export const decrement: <R, E>(ref: RefNumber<R, E>) => Effect.Effect<R, E, number> = <R, E>(
  ref: RefNumber<R, E>
) => ref.update(sub)
