import type { IdentifierConstructor, IdentifierOf } from "@typed/context/Identifier"
import type * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Effect } from "effect"
import { not } from "effect/Boolean"
import { strict } from "effect/Equivalence"
import type { Scope } from "effect/Scope"

/**
 * A RefSubject holding a boolean values
 * @since 1.18.0
 * @category models
 */
export interface RefBoolean<R, E> extends RefSubject.RefSubject<R, E, boolean> {}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E>(
  initial: Effect.Effect<R, E, boolean>
): Effect.Effect<R, never, RefBoolean<never, E>>
export function make<R, E>(
  initial: Fx.Fx<R, E, boolean>
): Effect.Effect<R | Scope, never, RefBoolean<never, E>>

export function make<R, E>(
  initial: Fx.FxInput<R, E, boolean>
): Effect.Effect<R | Scope, never, RefBoolean<never, E>> {
  return RefSubject.make(initial, strict())
}

/**
 * Create a Tagged RefBoolean
 * @since 1.18.0
 * @category constructors
 */
export const tagged: {
  <const I extends IdentifierConstructor<any>>(
    identifier: I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, boolean>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, boolean>
} = RefSubject.tagged<never, boolean>(strict())

/**
 * Set the value to true
 * @since 1.18.0
 */
export const asTrue: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, never, boolean> = <R, E>(
  ref: RefBoolean<R, E>
) => ref.set(true)

/**
 * Set the value to false
 * @since 1.18.0
 */
export const asFalse: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, never, boolean> = <R, E>(
  ref: RefBoolean<R, E>
) => ref.set(false)

/**
 * Toggle the boolean value between true and false
 * @since 1.18.0
 */
export const toggle: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, E, boolean> = <R, E>(ref: RefBoolean<R, E>) =>
  ref.update(not)
