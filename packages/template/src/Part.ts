import type { ElementSource } from "@typed/template/ElementSource"
import type { EventHandler } from "@typed/template/EventHandler"
import type { Rendered } from "@typed/wire"
import type { Cause } from "effect/Cause"
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
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface BooleanPart {
  readonly _tag: "boolean"
  readonly name: string
  readonly value: boolean | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface ClassNamePart {
  readonly _tag: "className"
  readonly value: ReadonlyArray<string> | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface DataPart {
  readonly _tag: "data"
  readonly value: Readonly<Record<string, string | undefined>> | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface EventPart {
  readonly _tag: "event"
  readonly name: string
  readonly value: EventHandler<unknown, never> | null | undefined
  readonly index: number
  readonly onCause: (cause: Cause<unknown>) => Effect<never, never, unknown>

  readonly update: <R>(value: EventHandler<R, never> | null | undefined) => Effect<R | Scope, never, void>
}

export interface PropertyPart {
  readonly _tag: "property"
  readonly name: string
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface RefPart<E = any> {
  readonly _tag: "ref"
  readonly value: ElementSource<Rendered, E>
  readonly index: number
}

export interface CommentPart {
  readonly _tag: "comment"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface TextPart {
  readonly _tag: "text"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export interface NodePart {
  readonly _tag: "node"
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"]) => Effect<Scope, never, void>
}

export type SparsePart = SparseAttributePart | SparseClassNamePart | SparseCommentPart

export interface SparseAttributePart {
  readonly _tag: "sparse/attribute"
  readonly name: string
  readonly parts: ReadonlyArray<AttributePart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}

export interface SparseClassNamePart {
  readonly _tag: "sparse/className"
  readonly parts: ReadonlyArray<ClassNamePart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}

export interface SparseCommentPart {
  readonly _tag: "sparse/comment"
  readonly parts: ReadonlyArray<CommentPart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}

export interface StaticText {
  readonly _tag: "static/text"
  readonly value: string
}

export type Parts = ReadonlyArray<Part | SparsePart>
