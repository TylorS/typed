import type { Chunk } from "effect/Chunk"

export class Template {
  readonly type = "template"

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
  readonly type = "element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>,
    readonly children: Array<Node>
  ) {}
}

export class NodePart {
  readonly type = "node"
  constructor(readonly index: number) {}
}

export class SelfClosingElementNode {
  readonly type = "self-closing-element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>
  ) {}
}

export class TextOnlyElement {
  readonly type = "text-only-element"
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
  readonly type = "attribute" as const
  constructor(
    readonly name: string,
    readonly value: string
  ) {}
}

export class AttrPartNode {
  readonly type = "attr" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class SparseAttrNode {
  readonly type = "sparse-attr" as const
  constructor(
    readonly name: string,
    readonly nodes: Array<AttrPartNode | TextNode>
  ) {}
}

export class BooleanNode {
  readonly type = "boolean" as const
  constructor(readonly name: string) {}
}

export class BooleanPartNode {
  readonly type = "boolean-part" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export type ClassNameNode = TextNode | ClassNamePartNode

export class ClassNamePartNode {
  readonly type = "className-part" as const
  constructor(readonly index: number) {}
}

export class SparseClassNameNode {
  readonly type: "sparse-class-name" = "sparse-class-name" as const

  constructor(readonly nodes: Array<ClassNameNode>) {}
}

export class DataPartNode {
  readonly type = "data" as const

  constructor(readonly index: number) {}
}

export class EventPartNode {
  readonly type = "event" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class PropertyPartNode {
  readonly type = "property" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

export class RefPartNode {
  readonly type = "ref" as const

  constructor(readonly index: number) {}
}

export type Text = TextNode | TextPartNode

export class TextNode {
  readonly type = "text" as const

  constructor(readonly value: string) {}
}

export class TextPartNode {
  readonly type = "text-part" as const

  constructor(readonly index: number) {}
}

export type Comment = CommentNode | CommentPartNode | SparseCommentNode

export class CommentNode {
  readonly type = "comment" as const

  constructor(readonly value: string) {}
}

export class CommentPartNode {
  readonly type = "comment-part" as const

  constructor(readonly index: number) {}
}

export class SparseCommentNode {
  readonly type = "sparse-comment" as const

  constructor(readonly nodes: Array<TextNode | CommentPartNode>) {}
}
