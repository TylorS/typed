import type * as Part from "@typed/template/Part"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import * as Effect from "effect/Effect"

export const DirectiveTypeId = Symbol.for("@typed/templateDirective")
export type DirectiveTypeId = typeof DirectiveTypeId

export interface Directive<R, E> extends Placeholder<R, E, unknown> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<R, E, unknown>
}

export function Directive<R, E>(
  directive: (part: Part.Part) => Effect.Effect<R, E, unknown>
): Directive<R, E> {
  return Object.assign(directive, {
    [DirectiveTypeId]: DirectiveTypeId
  }) as Directive<R, E>
}

const withTag = <T extends Part.Part["_tag"]>(tag: T) =>
<R, E>(
  directive: (part: Extract<Part.Part, { readonly _tag: T }>) => Effect.Effect<R, E, unknown>
): Directive<R, E> =>
  Directive((part) =>
    part._tag === tag ? directive(part as any) : Effect.logDebug(`Expected ${tag} Part but received ${part._tag}`)
  )

export const attribute: <R, E>(
  directive: (part: Part.AttributePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E> = withTag("attribute")

export const boolean: <R, E>(directive: (part: Part.BooleanPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("boolean")

export const className: <R, E>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E> = withTag("className")

export const data: <R, E>(directive: (part: Part.DataPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("data")

export const event: <R, E>(directive: (part: Part.EventPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("event")

export const property: <R, E>(directive: (part: Part.PropertyPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("property")

export const ref: <R, E>(directive: (part: Part.RefPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> = withTag(
  "ref"
)

export const comment: <R, E>(directive: (part: Part.CommentPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("comment")

export const text: <R, E>(directive: (part: Part.TextPart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("text")

export const node: <R, E>(directive: (part: Part.NodePart) => Effect.Effect<R, E, unknown>) => Directive<R, E> =
  withTag("node")

export function isDirective<R, E>(renderable: Renderable<R, E> | Placeholder<R, E>): renderable is Directive<R, E> {
  return typeof renderable === "function" && DirectiveTypeId in (renderable as object)
}
