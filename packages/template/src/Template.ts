/**
 * @since 1.0.0
 */
import type { Chunk } from "effect/Chunk"

/**
 * @since 1.0.0
 */
export class Template {
  readonly _tag = "template"

  constructor(
    readonly nodes: ReadonlyArray<Node>,
    readonly hash: string,
    // Parts are a array of Parts to the respective path from the root node to access it during
    readonly parts: ReadonlyArray<readonly [part: PartNode | SparsePartNode, path: Chunk<number>]>
  ) {}
}

/**
 * @since 1.0.0
 */
export type ParentNode = ElementNode | SelfClosingElementNode | TextOnlyElement

/**
 * @since 1.0.0
 */
export type Node =
  | ElementNode
  | SelfClosingElementNode
  | TextOnlyElement
  | TextNode
  | NodePart
  | Comment

/**
 * @since 1.0.0
 */
export type PartNode =
  | AttrPartNode
  | BooleanPartNode
  | ClassNamePartNode
  | DataPartNode
  | EventPartNode
  | NodePart
  | PropertyPartNode
  | PropertiesPartNode
  | RefPartNode
  | TextPartNode
  | CommentPartNode

/**
 * @since 1.0.0
 */
export type SparsePartNode = SparseAttrNode | SparseClassNameNode | SparseCommentNode

/**
 * @since 1.0.0
 */
export class ElementNode {
  readonly _tag = "element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>,
    readonly children: Array<Node>
  ) {}
}

/**
 * @since 1.0.0
 */
export class NodePart {
  readonly _tag = "node"
  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export class SelfClosingElementNode {
  readonly _tag = "self-closing-element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>
  ) {}
}

/**
 * @since 1.0.0
 */
export class TextOnlyElement {
  readonly _tag = "text-only-element"
  constructor(
    readonly tagName: string,
    readonly attributes: Array<Attribute>,
    readonly children: Array<Text>
  ) {}
}

/**
 * @since 1.0.0
 */
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
  | PropertiesPartNode
  | RefPartNode

/**
 * @since 1.0.0
 */
export class AttributeNode {
  readonly _tag = "attribute" as const
  constructor(
    readonly name: string,
    readonly value: string
  ) {}
}

/**
 * @since 1.0.0
 */
export class AttrPartNode {
  readonly _tag = "attr" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

/**
 * @since 1.0.0
 */
export class SparseAttrNode {
  readonly _tag = "sparse-attr" as const
  constructor(
    readonly name: string,
    readonly nodes: Array<AttrPartNode | TextNode>
  ) {}
}

/**
 * @since 1.0.0
 */
export class BooleanNode {
  readonly _tag = "boolean" as const
  constructor(readonly name: string) {}
}

/**
 * @since 1.0.0
 */
export class BooleanPartNode {
  readonly _tag = "boolean-part" as const
  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

/**
 * @since 1.0.0
 */
export type ClassNameNode = TextNode | ClassNamePartNode

/**
 * @since 1.0.0
 */
export class ClassNamePartNode {
  readonly _tag = "className-part" as const
  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export class SparseClassNameNode {
  readonly _tag = "sparse-class-name" as const

  constructor(readonly nodes: Array<ClassNameNode>) {}
}

/**
 * @since 1.0.0
 */
export class DataPartNode {
  readonly _tag = "data" as const

  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export class EventPartNode {
  readonly _tag = "event" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

/**
 * @since 1.0.0
 */
export class PropertyPartNode {
  readonly _tag = "property" as const

  constructor(
    readonly name: string,
    readonly index: number
  ) {}
}

/**
 * @since 1.0.0
 */
export class PropertiesPartNode {
  readonly _tag = "properties" as const

  constructor(
    readonly index: number
  ) {}
}

/**
 * @since 1.0.0
 */
export class RefPartNode {
  readonly _tag = "ref" as const

  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export type Text = TextNode | TextPartNode

/**
 * @since 1.0.0
 */
export class TextNode {
  readonly _tag = "text" as const

  constructor(readonly value: string) {}
}

/**
 * @since 1.0.0
 */
export class TextPartNode {
  readonly _tag = "text-part" as const

  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export type Comment = CommentNode | CommentPartNode | SparseCommentNode

/**
 * @since 1.0.0
 */
export class CommentNode {
  readonly _tag = "comment" as const

  constructor(readonly value: string) {}
}

/**
 * @since 1.0.0
 */
export class CommentPartNode {
  readonly _tag = "comment-part" as const

  constructor(readonly index: number) {}
}

/**
 * @since 1.0.0
 */
export class SparseCommentNode {
  readonly _tag = "sparse-comment" as const

  constructor(readonly nodes: Array<TextNode | CommentPartNode>) {}
}
