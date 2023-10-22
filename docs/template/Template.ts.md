---
title: Template.ts
nav_order: 18
parent: "@typed/template"
---

## Template overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AttrPartNode (class)](#attrpartnode-class)
    - [\_tag (property)](#_tag-property)
  - [Attribute (type alias)](#attribute-type-alias)
  - [AttributeNode (class)](#attributenode-class)
    - [\_tag (property)](#_tag-property-1)
  - [BooleanNode (class)](#booleannode-class)
    - [\_tag (property)](#_tag-property-2)
  - [BooleanPartNode (class)](#booleanpartnode-class)
    - [\_tag (property)](#_tag-property-3)
  - [ClassNameNode (type alias)](#classnamenode-type-alias)
  - [ClassNamePartNode (class)](#classnamepartnode-class)
    - [\_tag (property)](#_tag-property-4)
  - [Comment (type alias)](#comment-type-alias)
  - [CommentNode (class)](#commentnode-class)
    - [\_tag (property)](#_tag-property-5)
  - [CommentPartNode (class)](#commentpartnode-class)
    - [\_tag (property)](#_tag-property-6)
  - [DataPartNode (class)](#datapartnode-class)
    - [\_tag (property)](#_tag-property-7)
  - [ElementNode (class)](#elementnode-class)
    - [\_tag (property)](#_tag-property-8)
  - [EventPartNode (class)](#eventpartnode-class)
    - [\_tag (property)](#_tag-property-9)
  - [Node (type alias)](#node-type-alias)
  - [NodePart (class)](#nodepart-class)
    - [\_tag (property)](#_tag-property-10)
  - [ParentNode (type alias)](#parentnode-type-alias)
  - [PartNode (type alias)](#partnode-type-alias)
  - [PropertyPartNode (class)](#propertypartnode-class)
    - [\_tag (property)](#_tag-property-11)
  - [RefPartNode (class)](#refpartnode-class)
    - [\_tag (property)](#_tag-property-12)
  - [SelfClosingElementNode (class)](#selfclosingelementnode-class)
    - [\_tag (property)](#_tag-property-13)
  - [SparseAttrNode (class)](#sparseattrnode-class)
    - [\_tag (property)](#_tag-property-14)
  - [SparseClassNameNode (class)](#sparseclassnamenode-class)
    - [\_tag (property)](#_tag-property-15)
  - [SparseCommentNode (class)](#sparsecommentnode-class)
    - [\_tag (property)](#_tag-property-16)
  - [SparsePartNode (type alias)](#sparsepartnode-type-alias)
  - [Template (class)](#template-class)
    - [\_tag (property)](#_tag-property-17)
  - [Text (type alias)](#text-type-alias)
  - [TextNode (class)](#textnode-class)
    - [\_tag (property)](#_tag-property-18)
  - [TextOnlyElement (class)](#textonlyelement-class)
    - [\_tag (property)](#_tag-property-19)
  - [TextPartNode (class)](#textpartnode-class)
    - [\_tag (property)](#_tag-property-20)

---

# utils

## AttrPartNode (class)

**Signature**

```ts
export declare class AttrPartNode {
  constructor(readonly name: string, readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "attr"
```

## Attribute (type alias)

**Signature**

```ts
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
```

## AttributeNode (class)

**Signature**

```ts
export declare class AttributeNode {
  constructor(readonly name: string, readonly value: string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "attribute"
```

## BooleanNode (class)

**Signature**

```ts
export declare class BooleanNode {
  constructor(readonly name: string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "boolean"
```

## BooleanPartNode (class)

**Signature**

```ts
export declare class BooleanPartNode {
  constructor(readonly name: string, readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "boolean-part"
```

## ClassNameNode (type alias)

**Signature**

```ts
export type ClassNameNode = TextNode | ClassNamePartNode
```

## ClassNamePartNode (class)

**Signature**

```ts
export declare class ClassNamePartNode {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "className-part"
```

## Comment (type alias)

**Signature**

```ts
export type Comment = CommentNode | CommentPartNode | SparseCommentNode
```

## CommentNode (class)

**Signature**

```ts
export declare class CommentNode {
  constructor(readonly value: string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "comment"
```

## CommentPartNode (class)

**Signature**

```ts
export declare class CommentPartNode {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "comment-part"
```

## DataPartNode (class)

**Signature**

```ts
export declare class DataPartNode {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "data"
```

## ElementNode (class)

**Signature**

```ts
export declare class ElementNode {
  constructor(readonly tagName: string, readonly attributes: Array<Attribute>, readonly children: Array<Node>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "element"
```

## EventPartNode (class)

**Signature**

```ts
export declare class EventPartNode {
  constructor(readonly name: string, readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "event"
```

## Node (type alias)

**Signature**

```ts
export type Node = ElementNode | SelfClosingElementNode | TextOnlyElement | TextNode | NodePart | Comment
```

## NodePart (class)

**Signature**

```ts
export declare class NodePart {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "node"
```

## ParentNode (type alias)

**Signature**

```ts
export type ParentNode = ElementNode | SelfClosingElementNode | TextOnlyElement
```

## PartNode (type alias)

**Signature**

```ts
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
```

## PropertyPartNode (class)

**Signature**

```ts
export declare class PropertyPartNode {
  constructor(readonly name: string, readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "property"
```

## RefPartNode (class)

**Signature**

```ts
export declare class RefPartNode {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "ref"
```

## SelfClosingElementNode (class)

**Signature**

```ts
export declare class SelfClosingElementNode {
  constructor(readonly tagName: string, readonly attributes: Array<Attribute>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "self-closing-element"
```

## SparseAttrNode (class)

**Signature**

```ts
export declare class SparseAttrNode {
  constructor(readonly name: string, readonly nodes: Array<AttrPartNode | TextNode>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "sparse-attr"
```

## SparseClassNameNode (class)

**Signature**

```ts
export declare class SparseClassNameNode {
  constructor(readonly nodes: Array<ClassNameNode>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "sparse-class-name"
```

## SparseCommentNode (class)

**Signature**

```ts
export declare class SparseCommentNode {
  constructor(readonly nodes: Array<TextNode | CommentPartNode>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "sparse-comment"
```

## SparsePartNode (type alias)

**Signature**

```ts
export type SparsePartNode = SparseAttrNode | SparseClassNameNode | SparseCommentNode
```

## Template (class)

**Signature**

```ts
export declare class Template {
  constructor(
    readonly nodes: ReadonlyArray<Node>,
    readonly hash: string,
    // Parts are a array of Parts to the respective path from the root node to access it during
    readonly parts: ReadonlyArray<readonly [part: PartNode | SparsePartNode, path: Chunk<number>]>
  )
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "template"
```

## Text (type alias)

**Signature**

```ts
export type Text = TextNode | TextPartNode
```

## TextNode (class)

**Signature**

```ts
export declare class TextNode {
  constructor(readonly value: string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "text"
```

## TextOnlyElement (class)

**Signature**

```ts
export declare class TextOnlyElement {
  constructor(readonly tagName: string, readonly attributes: Array<Attribute>, readonly children: Array<Text>)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "text-only-element"
```

## TextPartNode (class)

**Signature**

```ts
export declare class TextPartNode {
  constructor(readonly index: number)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "text-part"
```