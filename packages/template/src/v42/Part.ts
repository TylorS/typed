import type { EventHandler } from "@typed/template/v42/EventHandler.js"
import type { ReadonlyRecord } from "effect/ReadonlyRecord"
import type { StaticPart } from "./internal/part.js"
import * as internal from "./internal/part.js"
import type { Template } from "./Template.js"

export type Parts = Array<Part | SparsePart>

export type Part =
  | AttributePart
  | BooleanAttributePart
  | ClassNamePart
  | CommentPart
  | TextPart
  | PropertyPart
  | NodePart
  | RefPart
  | DataPart
  | EventPart
  | SpreadPart

export type SparsePart =
  | SparseAttributePart
  | SparseClassNamePart
  | SparseCommentPart

export class AttributePart extends internal.StringPart<"Attribute"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Attribute", index, setValue)
  }
}

export class BooleanAttributePart extends internal.BooleanPart<"BooleanAttribute"> {
  constructor(index: number, setValue: (value: boolean | undefined | null) => void) {
    super("BooleanAttribute", index, setValue)
  }
}

export class ClassNamePart extends internal.StringPart<"ClassName"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("ClassName", index, setValue)
  }
}

export class CommentPart extends internal.StringPart<"Comment"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Comment", index, setValue)
  }
}

export class TextPart extends internal.StringPart<"Text"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Text", index, setValue)
  }
}

export class PropertyPart extends internal.UnknownPart<"Property"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Property", index, setValue)
  }
}

export class NodePart extends internal.Part<Node | Template | ReadonlyArray<Node | Template>> {
  readonly _tag = "Node" as const

  constructor(
    index: number,
    readonly setValue: (value: Node | Template | ReadonlyArray<Node | Template>) => void
  ) {
    super(index)
  }
}

export class RefPart {
  readonly _tag = "Ref" as const
  constructor(readonly index: number) {}
}

export class DataPart extends internal.Part<ReadonlyRecord<string, string | null | undefined>> {
  readonly _tag = "Data" as const

  constructor(index: number, readonly setValue: (value: ReadonlyRecord<string, string | null | undefined>) => void) {
    super(index)
  }
}

export class EventPart extends internal.Part<EventHandler | null | undefined> {
  readonly _tag = "Event" as const

  constructor(index: number, readonly setValue: (value: EventHandler) => void) {
    super(index)
  }
}

export class SparseAttributePart
  extends internal.StringPartGroup<"SparseAttribute", ReadonlyArray<AttributePart | StaticPart<string>>>
{
  constructor(
    parts: ReadonlyArray<AttributePart | StaticPart<string>>,
    setValue: (value: string | undefined | null) => void
  ) {
    super("SparseAttribute", parts, "", setValue)
  }
}

export class SparseClassNamePart
  extends internal.StringPartGroup<"SparseClassName", ReadonlyArray<AttributePart | StaticPart<string>>>
{
  constructor(
    parts: ReadonlyArray<AttributePart | StaticPart<string>>,
    setValue: (value: string | undefined | null) => void
  ) {
    super("SparseClassName", parts, " ", setValue)
  }
}

export class SparseCommentPart
  extends internal.StringPartGroup<"SparseComment", ReadonlyArray<CommentPart | StaticPart<string>>>
{
  constructor(
    parts: ReadonlyArray<CommentPart | StaticPart<string>>,
    setValue: (value: string | undefined | null) => void
  ) {
    super("SparseComment", parts, "", setValue)
  }
}

export class SpreadPart {
  readonly _tag = "Spread" as const

  constructor(readonly index: number) {
  }
}
