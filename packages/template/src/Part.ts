/**
 * @since 1.0.0
 */

import type { Cause } from "effect/Cause"
import type { Effect } from "effect/Effect"
import type { Scope } from "effect/Scope"
import type { ElementSource } from "./ElementSource.js"
import type { EventHandler } from "./EventHandler.js"

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export interface AttributePart {
  readonly _tag: "attribute"
  readonly name: string
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface BooleanPart {
  readonly _tag: "boolean"
  readonly name: string
  readonly value: boolean | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface ClassNamePart {
  readonly _tag: "className"
  readonly value: ReadonlyArray<string>
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface DataPart {
  readonly _tag: "data"
  readonly value: Readonly<Record<string, string | undefined>> | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface EventPart {
  readonly _tag: "event"
  readonly name: string
  readonly source: ElementSource<any>
  readonly value: null
  readonly index: number
  readonly onCause: (cause: Cause<unknown>) => Effect<unknown>
  readonly addEventListener: (handler: EventHandler<Event>) => void
}

/**
 * @since 1.0.0
 */
export interface PropertyPart {
  readonly _tag: "property"
  readonly name: string
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface RefPart<T extends HTMLElement | SVGElement = HTMLElement | SVGElement> {
  readonly _tag: "ref"
  readonly value: ElementSource<T>
  readonly index: number
}

/**
 * @since 1.0.0
 */
export interface CommentPart {
  readonly _tag: "comment"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface TextPart {
  readonly _tag: "text"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export interface NodePart {
  readonly _tag: "node"
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}

/**
 * @since 1.0.0
 */
export type Parts = ReadonlyArray<Part>
