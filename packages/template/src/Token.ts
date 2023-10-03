export type Token =
  | OpeningTagToken
  | OpeningTagEndToken
  | ClosingTagToken
  | AttributeToken
  | AttributeStartToken
  | AttributeEndToken
  | BooleanAttributeToken
  | BooleanAttributeStartToken
  | BooleanAttributeEndToken
  | ClassNameAttributeStartToken
  | ClassNameAttributeEndToken
  | DataAttributeStartToken
  | DataAttributeEndToken
  | EventAttributeStartToken
  | EventAttributeEndToken
  | PropertyAttributeStartToken
  | PropertyAttributeEndToken
  | RefAttributeStartToken
  | RefAttributeEndToken
  | CommentToken
  | CommentStartToken
  | CommentEndToken
  | TextToken
  | PartToken

export class OpeningTagToken {
  readonly _tag = "opening-tag"

  constructor(
    readonly name: string,
    readonly isSelfClosing: boolean = SELF_CLOSING_TAGS.has(name),
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) {}
}

export class AttributeStartToken {
  readonly _tag = "attribute-start"
  constructor(readonly name: string) {}
}

export class AttributeEndToken {
  readonly _tag = "attribute-end"
  constructor(readonly name: string) {}
}

export class BooleanAttributeStartToken {
  readonly _tag = "boolean-attribute-start"
  constructor(readonly name: string) {}
}

export class BooleanAttributeEndToken {
  readonly _tag = "boolean-attribute-end"
  constructor(readonly name: string) {}
}

export class ClassNameAttributeStartToken {
  readonly _tag = "className-attribute-start"
}

export class ClassNameAttributeEndToken {
  readonly _tag = "className-attribute-end"
}

export class DataAttributeStartToken {
  readonly _tag = "data-attribute-start"
}

export class DataAttributeEndToken {
  readonly _tag = "data-attribute-end"
}

export class EventAttributeStartToken {
  readonly _tag = "event-attribute-start"
  constructor(readonly name: string) {}
}

export class EventAttributeEndToken {
  readonly _tag = "event-attribute-end"
  constructor(readonly name: string) {}
}

export class PropertyAttributeStartToken {
  readonly _tag = "property-attribute-start"
  constructor(readonly name: string) {}
}

export class PropertyAttributeEndToken {
  readonly _tag = "property-attribute-end"
  constructor(readonly name: string) {}
}

export class RefAttributeStartToken {
  readonly _tag = "ref-attribute-start"
}

export class RefAttributeEndToken {
  readonly _tag = "ref-attribute-end"
}

export class AttributeToken {
  readonly _tag = "attribute"
  constructor(
    readonly name: string,
    readonly value: string
  ) {}
}

export class BooleanAttributeToken {
  readonly _tag = "boolean-attribute"
  constructor(readonly name: string) {}
}

export class OpeningTagEndToken {
  readonly _tag = "opening-tag-end"

  constructor(
    readonly name: string,
    readonly selfClosing: boolean = SELF_CLOSING_TAGS.has(name),
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) {}
}

export class ClosingTagToken {
  readonly _tag = "closing-tag"

  constructor(
    readonly name: string,
    readonly textOnly: boolean = TEXT_ONLY_NODES_REGEX.has(name)
  ) {}
}

export class CommentToken {
  readonly _tag = "comment"
  constructor(readonly value: string) {}
}

export class CommentStartToken {
  readonly _tag = "comment-start"
  constructor(readonly value: string) {}
}

export class CommentEndToken {
  readonly _tag = "comment-end"
  constructor(readonly value: string) {}
}

export class TextToken {
  readonly _tag = "text"
  constructor(readonly value: string) {}
}

export class PartToken {
  readonly _tag = "part-token"
  constructor(readonly index: number) {}
}

export const TEXT_ONLY_NODES_REGEX = new Set([
  "textarea",
  "script",
  "style",
  "title",
  "plaintext",
  "xmp"
])

export const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
])
