---
title: typescript/factories.ts
nav_order: 5
parent: "@typed/compiler"
---

## factories overview

Factory functiosn for creating TypeScript AST nodes

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DocumentFragmentType](#documentfragmenttype)
  - [DocumentType](#documenttype)
  - [ElementType](#elementtype)
  - [HTMLElementType](#htmlelementtype)
  - [NodeType](#nodetype)
  - [SVGElementType](#svgelementtype)
  - [TextType](#texttype)
  - [appendChild](#appendchild)
  - [createComment](#createcomment)
  - [createConst](#createconst)
  - [createDocumentFragment](#createdocumentfragment)
  - [createEffectYield](#createeffectyield)
  - [createElement](#createelement)
  - [createFunctionCall](#createfunctioncall)
  - [createMethodCall](#createmethodcall)
  - [createText](#createtext)
  - [createTypeReference](#createtypereference)
  - [createUnion](#createunion)
  - [createVariableDeclaration](#createvariabledeclaration)
  - [insertBefore](#insertbefore)
  - [removeChild](#removechild)
  - [setAttribute](#setattribute)
  - [toggleAttribute](#toggleattribute)

---

# utils

## DocumentFragmentType

`DocumentFragment` type reference

**Signature**

```ts
export declare const DocumentFragmentType: ts.TypeReferenceNode
```

Added in v1.0.0

## DocumentType

`Document` type reference

**Signature**

```ts
export declare const DocumentType: ts.TypeReferenceNode
```

Added in v1.0.0

## ElementType

`Element` type reference

**Signature**

```ts
export declare const ElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## HTMLElementType

`HTMLElement` type reference

**Signature**

```ts
export declare const HTMLElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## NodeType

`Node` type reference

**Signature**

```ts
export declare const NodeType: ts.TypeReferenceNode
```

Added in v1.0.0

## SVGElementType

`SVGElement` type reference

**Signature**

```ts
export declare const SVGElementType: ts.TypeReferenceNode
```

Added in v1.0.0

## TextType

`Text` type reference

**Signature**

```ts
export declare const TextType: ts.TypeReferenceNode
```

Added in v1.0.0

## appendChild

Append child

**Signature**

```ts
export declare function appendChild(parent: string, child: string)
```

Added in v1.0.0

## createComment

**Signature**

```ts
export declare function createComment(value: string)
```

Added in v1.0.0

## createConst

**Signature**

```ts
export declare function createConst(varName: string, expression: ts.Expression): ts.Statement
```

Added in v1.0.0

## createDocumentFragment

Create document fragment

**Signature**

```ts
export declare function createDocumentFragment()
```

Added in v1.0.0

## createEffectYield

**Signature**

```ts
export declare function createEffectYield(...expressions: Array<ts.Expression>): ts.Expression
```

Added in v1.0.0

## createElement

Create element

**Signature**

```ts
export declare function createElement(tagName: string)
```

Added in v1.0.0

## createFunctionCall

Creates a TypeScript function call

**Signature**

```ts
export declare function createFunctionCall(name: string | ts.Expression, args: Array<ts.Expression>): ts.CallExpression
```

Added in v1.0.0

## createMethodCall

Creates a TypeScript method call

**Signature**

```ts
export declare function createMethodCall(
  object: string | ts.Expression,
  methodName: string,
  typeParams: Array<ts.TypeNode>,
  args: Array<ts.Expression>
): ts.CallExpression
```

Added in v1.0.0

## createText

Create text node

**Signature**

```ts
export declare function createText(text: string)
```

Added in v1.0.0

## createTypeReference

Creates a TypeScript type reference by name

**Signature**

```ts
export declare function createTypeReference(name: string, ...args: Array<ts.TypeNode>): ts.TypeReferenceNode
```

Added in v1.0.0

## createUnion

Creates a TypeScript union types by name

**Signature**

```ts
export declare function createUnion(types: Array<ts.TypeNode>): ts.TypeNode
```

Added in v1.0.0

## createVariableDeclaration

Creates a TypeScript variable declaration

**Signature**

```ts
export declare function createVariableDeclaration(
  name: string,
  type?: ts.TypeNode,
  initializer?: ts.Expression
): ts.VariableDeclaration
```

Added in v1.0.0

## insertBefore

Insert before

**Signature**

```ts
export declare function insertBefore(parent: string, child: string, reference?: string | null)
```

Added in v1.0.0

## removeChild

Remove child

**Signature**

```ts
export declare function removeChild(parent: string, child: string)
```

Added in v1.0.0

## setAttribute

**Signature**

```ts
export declare function setAttribute(element: string, name: string, value: string, coerce: boolean = true)
```

Added in v1.0.0

## toggleAttribute

**Signature**

```ts
export declare function toggleAttribute(element: string, name: string)
```

Added in v1.0.0
