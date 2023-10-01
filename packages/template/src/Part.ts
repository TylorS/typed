import type { ElementRef } from "@typed/template/ElementRef"
import type { EventHandler } from "@typed/template/EventHandler"
import type { Rendered } from "@typed/wire"
import type { Effect } from "effect/Effect"
import type { Scope } from "effect/Scope"

export type Part =
  | AttributePart
  | BooleanPart
  | ClassNamePart
  | CommentPart
  | DataPart
  | EventPart
  | NodePart
  | PropertyPart
  | RefPart
  | TextPart

export interface AttributePart {
  readonly _tag: "attribute"
  readonly name: string
  readonly value: string | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface BooleanPart {
  readonly _tag: "boolean"
  readonly name: string
  readonly value: boolean | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface ClassNamePart {
  readonly _tag: "className"
  readonly value: ReadonlyArray<string> | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface DataPart {
  readonly _tag: "data"
  readonly value: Readonly<Record<string, string>> | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface EventPart {
  readonly _tag: "event"
  readonly name: string
  readonly value: EventHandler<unknown, unknown> | null | undefined // TODO: Represent an EventHandler

  readonly update: (
    value: this["value"] | ((event: Event) => Effect<unknown, unknown, unknown>)
  ) => Effect<Scope, never, void>
}

export interface PropertyPart {
  readonly _tag: "property"
  readonly name: string
  readonly value: unknown

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface RefPart {
  readonly _tag: "ref"
  readonly value: ElementRef<Rendered> | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface CommentPart {
  readonly _tag: "comment"
  readonly value: string | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface TextPart {
  readonly _tag: "text"
  readonly value: string | null | undefined

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface NodePart {
  readonly _tag: "node"
  readonly value: unknown

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export type SparsePart = SparseAttributePart | SparseClassNamePart

export interface SparseAttributePart {
  readonly _tag: "sparse/attribute"
  readonly name: string
  readonly parts: ReadonlyArray<AttributePart | StaticText>
}

export interface SparseClassNamePart {
  readonly _tag: "sparse/className"
  readonly name: string
  readonly parts: ReadonlyArray<ClassNamePart | StaticText>
}

export interface StaticText {
  readonly _tag: "static/text"
  readonly value: string
}

export type Parts = ReadonlyArray<Part | SparsePart>