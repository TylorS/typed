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
export interface Directive<R, E> extends Placeholder<R, E, unknown> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<unknown, E, R>
}

/**
 * @since 1.0.0
 */
export function Directive<R, E>(
  directive: (part: Part.Part) => Effect.Effect<unknown, E, R>
): Directive<R, E> {
  return Object.assign((p: Part.Part) => directive(p), {
    [DirectiveTypeId]: DirectiveTypeId
  }) as Directive<R, E>
}

const withTag = <T extends Part.Part["_tag"]>(tag: T) =>
<R, E>(
  directive: (part: Extract<Part.Part, { readonly _tag: T }>) => Effect.Effect<unknown, E, R>
): Directive<R, E> =>
  Directive((part) =>
    part._tag === tag ? directive(part as any) : Effect.logDebug(`Expected ${tag} Part but received ${part._tag}`)
  )

/**
 * @since 1.0.0
 */
export const attribute: <R, E>(
  directive: (part: Part.AttributePart) => Effect.Effect<unknown, E, R>
) => Directive<R, E> = withTag("attribute")

/**
 * @since 1.0.0
 */
export const boolean: <R, E>(directive: (part: Part.BooleanPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("boolean")

/**
 * @since 1.0.0
 */
export const className: <R, E>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<unknown, E, R>
) => Directive<R, E> = withTag("className")

/**
 * @since 1.0.0
 */
export const data: <R, E>(directive: (part: Part.DataPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("data")

/**
 * @since 1.0.0
 */
export const event: <R, E>(directive: (part: Part.EventPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("event")

/**
 * @since 1.0.0
 */
export const property: <R, E>(directive: (part: Part.PropertyPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("property")

/**
 * @since 1.0.0
 */
export const ref: <R, E>(directive: (part: Part.RefPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> = withTag(
  "ref"
)

/**
 * @since 1.0.0
 */
export const comment: <R, E>(directive: (part: Part.CommentPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("comment")

/**
 * @since 1.0.0
 */
export const text: <R, E>(directive: (part: Part.TextPart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("text")

/**
 * @since 1.0.0
 */
export const node: <R, E>(directive: (part: Part.NodePart) => Effect.Effect<unknown, E, R>) => Directive<R, E> =
  withTag("node")

/**
 * @since 1.0.0
 */
export function isDirective<R, E>(renderable: unknown): renderable is Directive<R, E> {
  return typeof renderable === "function" && DirectiveTypeId in (renderable as any)
}
