/**
 * Small wrapper around @effect/data/Context.Tag to allow
 * creating opaque identifiers for your services.
 * @since 1.0.0
 */

import * as C from "effect/Context"
import type { Tagged } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { makeIdentifier } from "@typed/context/Identifier"

/**
 * Provides extensions to the `Context` module's Tag implementation to
 * provide a more ergonomic API for working with Effect + Fx.
 * @since 1.0.0
 */
export interface Tag<I, S = I> extends C.Tag<I, S> {}

/**
 * Construct a Tag implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function Tag<const I extends IdentifierFactory<any>, S = I>(id: I | string): Tag<IdentifierOf<I>, S>
export function Tag<const I, S = I>(id: I | string): Tag<IdentifierOf<I>, S>
export function Tag<const I, S>(id: I): Tag<IdentifierOf<I>, S>
export function Tag<S>(): {
  <const I extends IdentifierFactory<any>>(id: I): Tag<IdentifierOf<I>, S>
  <const I>(id: I | string): Tag<IdentifierOf<I>, S>
}

export function Tag<S>(id?: unknown) {
  if (arguments.length > 0) {
    return makeTag<any, S>(id)
  } else {
    return makeTag
  }
}

function makeTag<const I extends IdentifierInput<any>, S>(id: I): Tag<IdentifierOf<I>, S> {
  return C.Tag<IdentifierOf<I>, S>(makeIdentifier(id))
}

/**
 * @since 1.0.0
 */
export namespace Tag {
  /**
   * Extract the Identifier of a Tag
   * @since 1.0.0
   */
  export type Identifier<T> = [T] extends [C.Tag<infer I, infer _>] ? I
    : [T] extends [Tagged<infer I, infer _>] ? I
    : never

  /**
   * Extract the Service of a Tag
   * @since 1.0.0
   */
  export type Service<T> = [T] extends [C.Tag<infer _, infer S>] ? S
    : [T] extends [Tagged<infer _, infer S>] ? S
    : never
}
