/**
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import type * as Part from "./Part.js"
import type { Placeholder } from "./Placeholder.js"

/**
 * @since 1.0.0
 */
export const DirectiveTypeId = Symbol.for("@typed/template/Directive")
/**
 * @since 1.0.0
 */
export type DirectiveTypeId = typeof DirectiveTypeId

/**
 * @since 1.0.0
 */
export interface Directive<E, R> extends Placeholder<unknown, E, R> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<unknown, E, R>
}

/**
 * @since 1.0.0
 */
export function Directive<E, R>(
  directive: (part: Part.Part) => Effect.Effect<unknown, E, R>
): Directive<E, R> {
  return Object.assign((p: Part.Part) => directive(p), {
    [DirectiveTypeId]: DirectiveTypeId
  }) as Directive<E, R>
}

const withTag = <T extends Part.Part["_tag"]>(tag: T) =>
<E, R>(
  directive: (part: Extract<Part.Part, { readonly _tag: T }>) => Effect.Effect<unknown, E, R>
): Directive<E, R> =>
  Directive((part) =>
    part._tag === tag ? directive(part as any) : Effect.logDebug(`Expected ${tag} Part but received ${part._tag}`)
  )

/**
 * @since 1.0.0
 */
export const attribute: <E, R>(
  directive: (part: Part.AttributePart) => Effect.Effect<unknown, E, R>
) => Directive<E, R> = withTag("attribute")

/**
 * @since 1.0.0
 */
export const boolean: <E, R>(directive: (part: Part.BooleanPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("boolean")

/**
 * @since 1.0.0
 */
export const className: <E, R>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<unknown, E, R>
) => Directive<E, R> = withTag("className")

/**
 * @since 1.0.0
 */
export const data: <E, R>(directive: (part: Part.DataPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("data")

/**
 * @since 1.0.0
 */
export const event: <E, R>(directive: (part: Part.EventPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("event")

/**
 * @since 1.0.0
 */
export const property: <E, R>(directive: (part: Part.PropertyPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("property")

/**
 * @since 1.0.0
 */
export const ref: <E, R>(directive: (part: Part.RefPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> = withTag(
  "ref"
)

/**
 * @since 1.0.0
 */
export const comment: <E, R>(directive: (part: Part.CommentPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("comment")

/**
 * @since 1.0.0
 */
export const text: <E, R>(directive: (part: Part.TextPart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("text")

/**
 * @since 1.0.0
 */
export const node: <E, R>(directive: (part: Part.NodePart) => Effect.Effect<unknown, E, R>) => Directive<E, R> =
  withTag("node")

/**
 * @since 1.0.0
 */
export function isDirective<E, R>(renderable: unknown): renderable is Directive<E, R> {
  return typeof renderable === "function" && DirectiveTypeId in (renderable as any)
}
