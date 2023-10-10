import type { Chunk } from "effect/Chunk"

export class Template {
  readonly _tag = "template"

  constructor(
    readonly nodes: ReadonlyArray<Node>,
    readonly hash: string,
    // Parts are a array of Parts to the respective path from the root node to access it during
    readonly parts: ReadonlyArray<readonly [part: PartNode | SparsePartNode, path: Chunk<number>]>
  ) {}
}

export type ParentNode = ElementNode | SelfClosingElementNode | TextOnlyElement

export type Node =
  | ElementNode
  | SelfClosingElementNode
  | TextOnlyElement
  | TextNode
  | NodePart
  | Comment

export type PartNode =
  | AttrPartNode
  | BooleanPartNode
  | ClassNamePartNode
  | DataPartNode
  | EventPartNode
  | NodePart
  | PropertyPartNode
  | RefPartNode
  | TextPartNode
  | CommentPartNode

export type SparsePartNode = SparseAttrNode | SparseClassNameNode | SparseCommentNode

export class ElementNode {
  readonly _tag = "element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>,
    readonly children: Array<Node>
  ) {}
}

export class NodePart {
  readonly _tag = "node"
  constructor(readonly index: number) {}
}

export class SelfClosingElementNode {
  readonly _tag = "self-closing-element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>
  ) {}
}

export class TextOnlyElement {
  readonly _tag = "text-only-element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>,
    readonly children: Array<Text>
  ) {}
}

export type Attribute =
  | AttributeNode
  | AttrPartNode
  | SparseAttrNode
  | BooleanNode
  | BooleanPartNode
  | ClassNameNode
  | SparseClassNameNode
  | DataPartNode
  | EventPartNode
  | PropertyPartNode
  | RefPartNode

export class AttributeNode {
  readonly _tag = "attribute" as const
  constructor(
    readonly name: string,
    readonly value: string
  ) {}
}

export class AttrPartNode {
  readonly _tag = "attr" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class SparseAttrNode {
  readonly _tag = "sparse-attr" as const
  constructor(
    readonly name: string,
    readonly nodes: Array<AttrPartNode | TextNode>
  ) {}
}

export class BooleanNode {
  readonly _tag = "boolean" as const
  constructor(readonly name: string) {}
}

export class BooleanPartNode {
  readonly _tag = "boolean-part" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export type ClassNameNode = TextNode | ClassNamePartNode

export class ClassNamePartNode {
  readonly _tag = "className-part" as const
  constructor(readonly index: number) {}
}

export class SparseClassNameNode {
  readonly _tag = "sparse-class-name" as const

  constructor(readonly nodes: Array<ClassNameNode>) {}
}

export class DataPartNode {
  readonly _tag = "data" as const

  constructor(readonly index: number) {}
}

export class EventPartNode {
  readonly _tag = "event" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class PropertyPartNode {
  readonly _tag = "property" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class RefPartNode {
  readonly _tag = "ref" as const

  constructor(readonly index: number) {}
}

export type Text = TextNode | TextPartNode

export class TextNode {
  readonly _tag = "text" as const

  constructor(readonly value: string) {}
}

export class TextPartNode {
  readonly _tag = "text-part" as const

  constructor(readonly index: number) {}
}

export type Comment = CommentNode | CommentPartNode | SparseCommentNode

export class CommentNode {
  readonly _tag = "comment" as const

  constructor(readonly value: string) {}
}

export class CommentPartNode {
  readonly _tag = "comment-part" as const

  constructor(readonly index: number) {}
}

export class SparseCommentNode {
  readonly _tag = "sparse-comment" as const

  constructor(readonly nodes: Array<TextNode | CommentPartNode>) {}
}
