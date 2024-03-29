import type { StaticPart } from "@typed/template/v42/Part"
import { BooleanPart, StringPart, StringPartGroup, UnknownPart } from "@typed/template/v42/Part"

export class AttributePart extends StringPart<"Attribute"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Attribute", index, setValue)
  }
}

export class BooleanAttributePart extends BooleanPart<"BooleanAttribute"> {
  constructor(index: number, setValue: (value: boolean | undefined | null) => void) {
    super("BooleanAttribute", index, setValue)
  }
}

export class ClassNamePart extends StringPart<"ClassName"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("ClassName", index, setValue)
  }
}

export class CommentPart extends StringPart<"Comment"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Comment", index, setValue)
  }
}

export class TextPart extends StringPart<"Text"> {
  constructor(index: number, setValue: (value: string | undefined | null) => void) {
    super("Text", index, setValue)
  }
}

export class PropertyPart extends UnknownPart<"Property"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Property", index, setValue)
  }
}

export class NodePart extends UnknownPart<"Node"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Node", index, setValue)
  }
}

export class RefPart extends UnknownPart<"Ref"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Ref", index, setValue)
  }
}

export class DataPart extends UnknownPart<"Data"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Data", index, setValue)
  }
}

export class EventPart extends UnknownPart<"Event"> {
  constructor(index: number, setValue: (value: unknown) => void) {
    super("Event", index, setValue)
  }
}

export class SparseAttributePart<Parts extends ReadonlyArray<AttributePart | StaticPart<string>>>
  extends StringPartGroup<"SparseAttribute", Parts>
{
  constructor(parts: Parts, setValue: (value: string | undefined | null) => void) {
    super("SparseAttribute", parts, "", setValue)
  }
}

export class SparseClassNamePart<Parts extends ReadonlyArray<AttributePart | StaticPart<string>>>
  extends StringPartGroup<"SparseClassName", Parts>
{
  constructor(parts: Parts, setValue: (value: string | undefined | null) => void) {
    super("SparseClassName", parts, " ", setValue)
  }
}

export class SparseCommentPart<Parts extends ReadonlyArray<CommentPart | StaticPart<string>>>
  extends StringPartGroup<"SparseComment", Parts>
{
  constructor(parts: Parts, setValue: (value: string | undefined | null) => void) {
    super("SparseComment", parts, "", setValue)
  }
}
